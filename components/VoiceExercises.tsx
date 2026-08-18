import confetti from "canvas-confetti";
import React, { useState, useEffect, useRef } from 'react';
import { StopCircle, Activity, CheckCircle2, Mic, Star } from 'lucide-react';
import { ViewState } from '../types';
import { useStore } from '../store/useStore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { analyzeAudio, DailyLimitError } from '../services/geminiService';
import { awardActivityXp } from '../lib/gamification';
import { motion } from 'framer-motion';

interface VoiceExercisesProps {
  setView: (view: ViewState) => void;
}

const EXERCISES = [
  {
    id: 'diaphragmatic_breathing',
    title: 'Diaphragmatic Breathing',
    description: 'Build vocal power and control by breathing from your diaphragm, reducing chest tension.',
    icon: 'air',
    duration: 60,
    steps: [
      'Inhale deeply through your nose for 4 seconds, expanding your stomach.',
      'Hold your breath for 2 seconds.',
      'Exhale slowly through your mouth for 6 seconds, pulling your stomach in.',
      'Repeat this cycle.'
    ]
  },
  {
    id: 'self_affirmation_vocals',
    title: 'Vocal Affirmations',
    description: 'Learn to appreciate your own voice by speaking positive affirmations with slow, deep conviction.',
    icon: 'favorite',
    duration: 45,
    steps: [
      'Take a deep belly breath.',
      'Say out loud: "My voice has value, and I deserve to be heard."',
      'Pause for 2 seconds, feeling the resonance in your chest.',
      'Say: "I speak clearly, calmly, and with purpose."',
      'Repeat slowly, lowering your pitch slightly each time.'
    ]
  },
  {
    id: 'pitch_glides',
    title: 'Pitch Glides (Sirens)',
    description: 'Expand your vocal range and smooth out your tone to prevent voice cracking under stress.',
    icon: 'graphic_eq',
    duration: 45,
    steps: [
      'Start on your lowest comfortable note on an "Oo" or "Ah" sound.',
      'Slowly glide up to your highest comfortable note without pushing.',
      'Glide back down to your lowest note.',
      'Keep the sound continuous and smooth.'
    ]
  },
  {
    id: 'resonance_humming',
    title: 'Chest Resonance Humming',
    description: 'Improve vocal resonance and charisma by finding your warm, authoritative chest voice.',
    icon: 'record_voice_over',
    duration: 30,
    steps: [
      'Close your lips gently and relax your jaw.',
      'Hum a low, comfortable note (like "Hmmmm").',
      'Place a hand on your chest and feel the vibration.',
      'Try to make the vibration stronger in your chest without increasing volume.'
    ]
  },
  {
    id: 'articulation',
    title: 'Articulation Twisters',
    description: 'Sharpen your pronunciation and clarity to stop mumbling.',
    icon: 'text_to_speech',
    duration: 45,
    steps: [
      'Repeat: "Red leather, yellow leather" 5 times quickly.',
      'Repeat: "Unique New York" 5 times quickly.',
      'Focus on over-enunciating every consonant.',
      'Slow down if you stumble, then speed up again.'
    ]
  },
  {
    id: 'lip_trills',
    title: 'Lip Trills (Motorboat)',
    description: 'Relax your lips and vocal cords while maintaining consistent breath support.',
    icon: 'face',
    duration: 30,
    steps: [
      'Relax your lips and blow air through them so they vibrate (like a motorboat).',
      'Add a pitch to the trill, starting low and sliding high.',
      'If your lips stop vibrating, use your fingers to gently push your cheeks forward.',
      'Keep the airflow steady and relaxed.'
    ]
  },
  {
    id: 'yawn_sigh',
    title: 'Yawn-Sigh Release',
    description: 'Relieve throat tension caused by anxiety and find a relaxed, open vocal posture.',
    icon: 'sentiment_satisfied',
    duration: 30,
    steps: [
      'Open your mouth wide and simulate a deep, genuine yawn.',
      'As you exhale, let out a gentle, descending sigh on an "Ah" vowel.',
      'Focus on the feeling of openness and space in the back of your throat.',
      'Repeat 5 times, letting go of any neck tension.'
    ]
  },
  {
    id: 'consonant_crispness',
    title: 'Consonant Crispness',
    description: 'Train the tip of your tongue to enunciate sharply for a more intelligent, articulate sound.',
    icon: 'spellcheck',
    duration: 45,
    steps: [
      'Repeat the sequence: "Pa-Ta-Ka, Pa-Ta-Ka, Pa-Ta-Ka".',
      'Focus on making the P, T, and K sounds as crisp and explosive as possible.',
      'Repeat the sequence: "Ba-Da-Ga, Ba-Da-Ga, Ba-Da-Ga".',
      'Make sure your jaw stays relaxed while your lips and tongue do the work.'
    ]
  },
  {
    id: 'staccato_arpeggios',
    title: 'Staccato Arpeggios',
    description: 'Improve vocal agility and diaphragm control with short, detached, punchy notes.',
    icon: 'music_note',
    duration: 45,
    steps: [
      'Sing short, bouncy notes on "Ha" or "Ma".',
      'Go up and down a simple scale (1-3-5-3-1).',
      'Ensure each note is distinct and supported by a quick pulse from your diaphragm.',
      'Keep your jaw incredibly relaxed.'
    ]
  },
  {
    id: 'fricative_consonants',
    title: 'Fricative Focus Support',
    description: 'Strengthen breath support using continuous consonant sounds to stop running out of breath mid-sentence.',
    icon: 'waves',
    duration: 45,
    steps: [
      'Take a deep belly breath.',
      'Exhale slowly on a continuous "Ssssss" sound for 10 seconds.',
      'Repeat with a "Shhhhh" sound for 10 seconds.',
      'Repeat with an "Ffffff" sound for 10 seconds.',
      'Focus on keeping the airflow perfectly steady with no shaking.'
    ]
  },
  {
    id: 'vocal_fry_elimination',
    title: 'Vocal Fry Elimination',
    description: 'Train yourself to speak with full support to the end of sentences, avoiding the croaky "vocal fry".',
    icon: 'mic_external_on',
    duration: 40,
    steps: [
      'Take a medium breath.',
      'Say: "I am speaking clearly all the way to the end of this sentence."',
      'Ensure the last three words have just as much air support as the first three.',
      'If you hear a croak at the end, inhale deeper and push slightly more air on the last word.'
    ]
  },
  {
    id: 'the_power_pause',
    title: 'The Power Pause',
    description: 'Train yourself to be comfortable with silence, avoiding filler words like "um" and "uh".',
    icon: 'pause_circle',
    duration: 60,
    steps: [
      'Speak for 5 seconds about what you did today.',
      'Stop completely and hold eye contact (or look straight ahead) in silence for 3 FULL seconds.',
      'Speak for another 5 seconds.',
      'Repeat. Notice the urge to fill the silence, and resist it.'
    ]
  },
  {
    id: 'volume_dynamics',
    title: 'Volume Dynamics Control',
    description: 'Practice intentionally changing volume to add charisma and hold attention.',
    icon: 'volume_up',
    duration: 45,
    steps: [
      'Count from 1 to 10.',
      'Start at a whisper at 1, increasing volume steadily until 5 is a loud, commanding voice.',
      'From 6 to 10, decrease the volume back down to a whisper.',
      'Ensure the volume increase comes from your stomach (air), not your throat (squeezing).'
    ]
  },
  {
    id: 'emotional_coloring',
    title: 'Emotional Coloring',
    description: 'Practice injecting genuine emotion into neutral sentences so you don\'t sound robotic.',
    icon: 'theater_comedy',
    duration: 60,
    steps: [
      'Say "I am going to the store" with deep sadness.',
      'Say "I am going to the store" with immense hidden excitement.',
      'Say "I am going to the store" with authoritative anger.',
      'Notice how your pitch, pace, and facial expressions naturally change.'
    ]
  },
  {
    id: 'the_chewing_exercise',
    title: 'The Chewing Exercise',
    description: 'Release jaw tension (where many people hold anxiety) for a warmer, freer voice.',
    icon: 'restaurant',
    duration: 30,
    steps: [
      'Pretend you are chewing a massive piece of toffee.',
      'Make large, exaggerated chewing motions with your jaw and lips.',
      'Add a gentle humming sound ("Mmmmm") while chewing.',
      'Feel the tension melt out of your jaw hinges.'
    ]
  },
  {
    id: 'vowel_lengthening',
    title: 'Luxurious Vowels',
    description: 'Charismatic speakers string words together smoothly by lengthening vowels. Practice this flow.',
    icon: 'water_drop',
    duration: 45,
    steps: [
      'Say: "How are you doing today?" normally.',
      'Now say it again, dragging out the vowels: "Hoooow aaaaare yoooou dooooing toooodaaaay?"',
      'Make it sound like one continuous stream of water.',
      'Now say it normally again, keeping 20% of that smooth, connected feeling.'
    ]
  },
  {
    id: 'smiling_voice',
    title: 'The Smiling Voice',
    description: 'Learn how physical facial expressions physically change the tone of your voice.',
    icon: 'emoji_emotions',
    duration: 40,
    steps: [
      'Say "Hello, it is wonderful to meet you" with a completely deadpan, blank face.',
      'Now, force a massive, exaggerated smile and say the exact same sentence.',
      'Listen to the difference in brightness and warmth. The smile physically shortens the vocal tract.'
    ]
  },
  {
    id: 'tongue_trills',
    title: 'Tongue Trills (Rolling R\'s)',
    description: 'Relax the tongue root, an area that tightens up when we feel judged or nervous.',
    icon: 'language',
    duration: 30,
    steps: [
      'Place the tip of your tongue behind your top teeth.',
      'Exhale and let your tongue tip flap rapidly (roll your R\'s).',
      'If you cannot roll your R\'s, make a rapid "Duh-duh-duh-duh" sound instead.',
      'Glide your pitch up and down while doing this.'
    ]
  },
  {
    id: 'mask_resonance',
    title: 'Forward Mask Resonance',
    description: 'Bring your voice "forward" into the front of your face for maximum clarity and cut-through.',
    icon: 'masks',
    duration: 40,
    steps: [
      'Make a bright, nasal "Nnnnnn" or "Mmmmmm" sound, like a mosquito.',
      'Feel the buzzing right behind your nose and upper teeth (the "mask").',
      'Open the hum into an "Ah" vowel ("Nnnnnn-Ahhhhh"), trying to keep the buzz forward in your face.'
    ]
  },
  {
    id: 'self_compassion_mirror',
    title: 'Vocal Mirror Reflection',
    description: 'A psychological exercise to stop hating the sound of your recorded voice.',
    icon: 'psychology',
    duration: 60,
    steps: [
      'Hit start and speak normally about something you deeply enjoy for 30 seconds.',
      'Imagine you are listening to a dear friend, not yourself.',
      'Acknowledge the unique timbre, quirks, and humanity in your voice.',
      'Your voice is the physical manifestation of your life experience. Appreciate it.'
    ]
  }
];

export function VoiceExercises({ setView }: VoiceExercisesProps) {
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ transcript: string, feedback: string, score: number } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let timer: number;
    if (isActive && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      stopExercise();
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleExerciseComplete = async () => {
    if (!auth.currentUser || !userData) return;

    try {
      // Today's usage count was already incremented server-side inside the
      // analyze-audio call above — this just awards XP/level and extends
      // the streak (shared with every other activity, see gamification.ts).
      await awardActivityXp(auth.currentUser.uid, 20);

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2663eb', '#3b82f6', '#60a5fa', '#fbbf24', '#f59e0b']
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const startExercise = async (exerciseId: string) => {
    if (userData && !userData.isPro && userData.dailyExercises >= 1) {
      setView('paywall');
      return;
    }

    const exercise = EXERCISES.find(e => e.id === exerciseId);
    if (!exercise) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        setIsProcessing(true);
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          try {
            const isPro = useStore.getState().isPro;
            const result = await analyzeAudio(base64data, 'audio/webm', `The user is performing a voice exercise: ${exercise.title}. Provide feedback on their execution of the exercise.`, isPro);
            setAnalysisResult(result);
            await handleExerciseComplete();
          } catch (error) {
            if (error instanceof DailyLimitError) {
              useStore.getState().addToast(error.message, 'error');
              setActiveExercise(null);
              setIsActive(false);
              setShowResult(false);
              setView('paywall');
            } else {
              console.error("Error analyzing exercise audio:", error);
              useStore.getState().addToast('Analysis failed, but exercise recorded.', 'info');
              await handleExerciseComplete(); // Still complete it even if analysis fails
            }
          } finally {
            setIsProcessing(false);
          }
        };
      };

      mediaRecorder.start();
      setActiveExercise(exerciseId);
      setTimeLeft(exercise.duration);
      setIsActive(true);
      setShowResult(false);
      setAnalysisResult(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      useStore.getState().addToast('Microphone access is required for voice exercises.', 'error');
    }
  };

  const stopExercise = () => {
    setIsActive(false);
    setShowResult(true);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const currentExercise = EXERCISES.find(e => e.id === activeExercise);
  const streak = userData?.streak || 0;
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = userData?.lastExerciseDate === today;

  return (
    <main className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-6">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 border-b border-outline-variant/20 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold mb-1 block">Daily Routine</span>
              <h2 className="font-headline text-2xl font-extrabold tracking-tight text-primary leading-tight">Vocal Warm-up</h2>
              <p className="text-on-surface-variant text-sm mt-1">Your vocal cords are muscles. Train them daily to build resonance and charisma.</p>
            </div>
            <button 
              onClick={() => setView('voice_analyzer')}
              className="bg-primary/10 text-primary p-2 rounded-xl hover:bg-primary/20 transition-colors shrink-0"
              title="Voice Analyzer"
            >
              <Activity className="" />
            </button>
          </div>
          
          <div className="flex items-center gap-4 bg-surface-container-low p-3 rounded-xl border border-outline-variant/10">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${streak > 0 ? 'bg-error/10 text-error' : 'bg-surface-variant text-on-surface-variant'}`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: streak > 0 ? "'FILL' 1" : "'FILL' 0" }}>local_fire_department</span>
            </div>
            <div>
              <div className="font-headline font-bold text-sm text-primary">{streak} Day Streak</div>
              <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                {isCompletedToday ? 'Completed for today!' : 'Complete an exercise to extend'}
              </div>
            </div>
          </div>
        </header>

        {!activeExercise || (showResult && !isProcessing && analysisResult) ? (
          <div className="grid grid-cols-1 gap-4">
            {EXERCISES.map((exercise, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={exercise.id} 
                className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-secondary/20"></div>
                <div className="flex justify-between items-start mb-3 pl-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary text-sm">{exercise.icon}</span>
                    </div>
                    <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold">Step {index + 1}</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{exercise.duration}s</span>
                </div>
                <h3 className="font-headline text-base font-bold text-primary mb-1 pl-2">{exercise.title}</h3>
                <p className="text-xs text-on-surface-variant font-body leading-relaxed flex-1 mb-4 pl-2">{exercise.description}</p>
                <button
                  onClick={() => startExercise(exercise.id)}
                  className="w-full py-2.5 rounded-xl font-headline font-bold text-xs bg-surface-container-high text-primary hover:bg-surface-dim transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Mic className="text-sm" />
                  Start Recording
                </button>
              </motion.div>
            ))}
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 shadow-sm">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="text-primary text-3xl animate-pulse" />
              </div>
            </div>
            <h3 className="font-headline text-xl font-bold text-primary mb-2">Analyzing Voice...</h3>
            <p className="text-sm text-on-surface-variant text-center max-w-[250px]">
              Evaluating your pitch, resonance, and articulation.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 shadow-sm">
            <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold mb-3 block">{currentExercise?.title}</span>
            
            <div className="relative flex items-center justify-center mb-8">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle className="text-surface-container-high" cx="64" cy="64" fill="transparent" r="56" stroke="currentColor" strokeWidth="6"></circle>
                <circle 
                  className="text-secondary transition-all duration-1000 ease-linear" 
                  cx="64" cy="64" fill="transparent" r="56" stroke="currentColor" 
                  strokeDasharray="351.86" 
                  strokeDashoffset={351.86 - (351.86 * (timeLeft / (currentExercise?.duration || 1)))} 
                  strokeLinecap="round" strokeWidth="6"
                ></circle>
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="font-mono text-3xl font-bold text-primary">{timeLeft}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Seconds</span>
              </div>
            </div>

            <div className="w-full bg-surface-container-low p-4 rounded-xl mb-8">
              <h4 className="font-headline font-bold text-xs text-primary uppercase tracking-wider mb-3">Instructions</h4>
              <ul className="space-y-2">
                {currentExercise?.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-on-surface-variant font-body">
                    <span className="font-bold text-secondary">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={stopExercise}
              className="px-6 py-2.5 rounded-xl font-headline font-bold text-xs bg-error/10 text-error hover:bg-error/20 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
            >
              <StopCircle className="text-sm" />
              Stop & Analyze
            </button>
          </div>
        )}

        {showResult && analysisResult && !isProcessing && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 shadow-sm mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline text-lg font-bold text-primary flex items-center gap-2">
                <CheckCircle2 className="text-tertiary text-lg" />
                Exercise Completed
              </h3>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-sm">
                Score: {analysisResult.score}/100
              </div>
            </div>
            
            <div className="bg-surface-container-low p-4 rounded-xl mb-4">
              <h4 className="font-headline text-xs font-bold text-primary uppercase tracking-wider mb-2">AI Feedback</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">{analysisResult.feedback}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-secondary font-bold bg-secondary/10 p-3 rounded-xl mb-5">
              <Star className="text-sm" />
              +20 XP Earned! Streak updated.
            </div>

            <button
              onClick={() => { setShowResult(false); setActiveExercise(null); setAnalysisResult(null); }}
              className="w-full py-2.5 rounded-xl font-headline font-bold text-xs bg-primary text-on-primary hover:bg-primary/90 transition-all active:scale-95"
            >
              Back to Routine
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
