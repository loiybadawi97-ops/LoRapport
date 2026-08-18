import confetti from "canvas-confetti";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StopCircle, Lightbulb, Star, CheckCircle2, Sparkles, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewState } from '../types';
import { useStore } from '../store/useStore';
import { analyzeAudio, generateChallenge, DailyLimitError } from '../services/geminiService';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { awardActivityXp } from '../lib/gamification';

interface SpeakingChallengesProps {
  setView: (view: ViewState) => void;
}

const ALL_CHALLENGES = [
  { id: 1, title: 'Elevator Pitch', prompt: 'Introduce yourself and your current project in 30 seconds.', duration: 30, hint: 'Focus on your name, your role, and the unique value you bring.' },
  { id: 2, title: 'The Unexpected Question', prompt: 'What is your biggest weakness and how do you manage it?', duration: 45, hint: 'Pick a real weakness, but focus 80% of your time on the solution.' },
  { id: 3, title: 'Storytelling', prompt: 'Tell a quick story about a time you failed and what you learned.', duration: 60, hint: 'Use the STAR method: Situation, Task, Action, Result.' },
  // ... Keeping a subset for daily rotations
  { id: 4, title: 'The Sales Pitch', prompt: 'Sell me the pen you are holding right now.', duration: 30, hint: 'Focus on the problem the pen solves, not its features.' },
  { id: 5, title: 'Explain Like I\'m 5', prompt: 'Explain how the internet works to a 5-year-old.', duration: 45, hint: 'Use simple analogies like roads, mailmen, or magic boxes.' },
  { id: 6, title: 'The Apology', prompt: 'Apologize to a client for a missed deadline without making excuses.', duration: 30, hint: 'Take ownership, state the fix, and provide a new timeline.' },
  { id: 7, title: 'The Toast', prompt: 'Give a quick toast at your best friend\'s wedding.', duration: 60, hint: 'Start with a joke, share a brief memory, and end with a warm wish.' },
];

export function SpeakingChallenges({ setView }: SpeakingChallengesProps) {
  const [activeChallengeId, setActiveChallengeId] = useState<number | string | null>(null);
  const [activeChallengeData, setActiveChallengeData] = useState<any>(null);
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ transcript: string; feedback: string; score: number } | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);

  // AI Custom Challenge State
  const [searchTopic, setSearchTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customChallenges, setCustomChallenges] = useState<any[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Get daily challenges based on the day of the year
  const dailyChallenges = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    
    return [
      ALL_CHALLENGES[dayOfYear % ALL_CHALLENGES.length],
      ALL_CHALLENGES[(dayOfYear + 1) % ALL_CHALLENGES.length]
    ];
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setCompletedChallenges(data.completedChallenges || []);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let timer: number;
    if (isRecording && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRecording) {
      stopChallenge();
    }
    return () => {
      clearInterval(timer);
    };
  }, [isRecording, timeLeft]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleGenerateChallenge = async () => {
    if (!searchTopic.trim() || isGenerating) return;
    setIsGenerating(true);
    
    try {
      const isPro = userData?.isPro || false;
      const newChallengeData = await generateChallenge(searchTopic, "speaking", isPro);
      
      if (newChallengeData && newChallengeData.title) {
        const newChallenge = {
          id: `ai_${Date.now()}`,
          title: newChallengeData.title,
          prompt: newChallengeData.description,
          duration: newChallengeData.timeLimit || 45,
          hint: newChallengeData.goal
        };
        setCustomChallenges(prev => [newChallenge, ...prev]);
        setSearchTopic('');
      } else {
        useStore.getState().addToast('Failed to generate challenge. Please try again.', 'error');
      }
    } catch (error) {
      console.error(error);
      useStore.getState().addToast('Error generating challenge.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChallengeComplete = async (challengeId: number | string) => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { completedChallenges: arrayUnion(challengeId) });
      // XP/level/streak all go through the shared helper (today's usage count
      // was already incremented server-side inside the analyze-audio call).
      await awardActivityXp(auth.currentUser.uid, 50);

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

  const startChallenge = async (challenge: any) => {
    if (userData && !userData.isPro && userData.dailyChallenges >= 3) {
      setView('paywall');
      return;
    }

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
        setIsProcessing(true);
        setShowResult(true);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64Audio = base64data.split(',')[1];

          try {
            const isPro = useStore.getState().isPro;
            // usageType 'challenge' counts against dailyChallenges server-side,
            // separately from Voice Analyzer/Exercises' dailyExercises bucket.
            const analysis = await analyzeAudio(base64Audio, 'audio/webm', `The user was asked to: ${challenge.prompt}`, isPro, 'challenge');
            setResult(analysis);
            await handleChallengeComplete(challenge.id);
          } catch (error) {
            if (error instanceof DailyLimitError) {
              useStore.getState().addToast(error.message, 'error');
              setActiveChallengeId(null);
              setActiveChallengeData(null);
              setShowResult(false);
              setView('paywall');
            } else {
              console.error("Error processing audio:", error);
              useStore.getState().addToast('Analysis failed, but challenge recorded.', 'info');
              await handleChallengeComplete(challenge.id);
            }
          } finally {
            setIsProcessing(false);
          }
        };

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setActiveChallengeId(challenge.id);
      setActiveChallengeData(challenge);
      setTimeLeft(challenge.duration);
      setIsRecording(true);
      setShowResult(false);
      setResult(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      useStore.getState().addToast('Microphone access is required for this feature.', 'error');
    }
  };

  const stopChallenge = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-6 bg-surface">
      <div className="space-y-8 max-w-2xl mx-auto">
        <header className="flex flex-col gap-4">
          <div>
            <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Simulator
            </span>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-primary leading-tight">Impromptu Speaking</h2>
            <p className="text-on-surface-variant text-sm mt-1">Generate dynamic challenges or play the daily rotation.</p>
          </div>
          
          <div className="flex gap-2 relative mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input 
                type="text" 
                placeholder="Topic (e.g. 'Asking for a raise')"
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateChallenge()}
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-inner"
              />
            </div>
            <button 
              onClick={handleGenerateChallenge}
              disabled={isGenerating || !searchTopic.trim()}
              className="bg-primary text-on-primary px-6 font-bold rounded-xl flex items-center justify-center disabled:opacity-50 transition-all hover:bg-primary/90 active:scale-95 shadow-md"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate"}
            </button>
          </div>
        </header>

        {!activeChallengeId || (showResult && !isProcessing && result) ? (
          <div className="grid grid-cols-1 gap-6">
            {showResult && result && (
              <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 shadow-xl mb-4 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                <h3 className="font-headline text-xl font-bold text-primary mb-4 flex items-center gap-2 relative z-10">
                  <CheckCircle2 className="text-green-500 text-xl" />
                  Analysis Complete
                </h3>
                
                <div className="space-y-6 mb-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="relative flex items-center justify-center">
                      <svg className="w-16 h-16">
                        <circle className="text-surface-container-high" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="6"></circle>
                        <circle className="text-primary" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeDasharray="175.9" strokeDashoffset={175.9 - (175.9 * result.score) / 100} strokeLinecap="round" strokeWidth="6" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}></circle>
                      </svg>
                      <span className="absolute font-headline text-lg font-extrabold text-primary">{result.score}</span>
                    </div>
                    <div>
                      <span className="font-label text-[10px] uppercase font-bold text-primary tracking-widest block mb-1">Delivery Score</span>
                      <p className="text-sm text-on-surface-variant font-medium">
                        {result.score >= 80 ? 'Excellent' : result.score >= 60 ? 'Good, but needs work' : 'Needs improvement'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="font-label text-[10px] uppercase font-bold text-secondary tracking-widest block mb-1">Transcript</span>
                    <p className="text-sm text-on-surface italic font-body bg-surface-container-low p-3 rounded-xl shadow-inner">"{result.transcript}"</p>
                  </div>
                  
                  <div>
                    <span className="font-label text-[10px] uppercase font-bold text-error tracking-widest block mb-1">Feedback</span>
                    <p className="text-sm text-on-surface font-body leading-relaxed">{result.feedback}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-secondary font-bold bg-secondary/10 p-3 rounded-xl mb-6 border border-secondary/20 relative z-10">
                  <Star className="text-lg" />
                  +50 XP Earned!
                </div>

                <button
                  onClick={() => { setShowResult(false); setActiveChallengeId(null); setResult(null); }}
                  className="w-full py-3 rounded-xl font-headline font-bold text-sm bg-primary text-on-primary hover:bg-primary/90 transition-all active:scale-95 shadow-md relative z-10"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {!showResult && (
              <div className="space-y-6">
                
                {/* Custom Generated Challenges */}
                <AnimatePresence>
                  {customChallenges.map(challenge => {
                    const isCompleted = completedChallenges.includes(challenge.id);
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        key={challenge.id} 
                        className={`bg-primary/5 border border-primary/30 rounded-3xl p-6 shadow-md relative overflow-hidden`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                            <Sparkles className="w-4 h-4" /> AI Generated
                          </div>
                          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{challenge.duration}s</span>
                        </div>
                        <h3 className="font-headline text-xl font-bold text-primary mb-2">{challenge.title}</h3>
                        <p className="text-sm text-on-surface-variant font-body leading-relaxed mb-4">{challenge.prompt}</p>
                        
                        <div className="bg-surface p-3 rounded-xl mb-6 flex gap-2 items-start border border-outline-variant/10">
                          <Lightbulb className="text-tertiary text-lg mt-0.5" />
                          <p className="text-xs text-on-surface-variant italic leading-relaxed">Goal: {challenge.hint}</p>
                        </div>

                        <button
                          onClick={() => startChallenge(challenge)}
                          className={`w-full py-3 rounded-xl font-headline font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${isCompleted ? 'bg-surface-container-high text-primary hover:bg-surface-dim' : 'bg-primary text-on-primary hover:bg-primary/90 shadow-md'}`}
                        >
                          <span className="material-symbols-outlined text-lg">{isCompleted ? 'replay' : 'mic'}</span>
                          {isCompleted ? 'Try Again' : 'Start AI Challenge'}
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {/* Daily Challenges */}
                <h3 className="font-headline text-lg font-bold text-on-surface-variant mt-8">Daily Rotation</h3>
                <div className="grid grid-cols-1 gap-4">
                  {dailyChallenges.map(challenge => {
                    const isCompleted = completedChallenges.includes(challenge.id);
                    return (
                    <div key={challenge.id} className={`bg-surface-container-lowest border ${isCompleted ? 'border-primary/30 bg-primary/5' : 'border-outline-variant/20'} rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden`}>
                      {isCompleted && <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>}
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-xl">{isCompleted ? 'check_circle' : 'timer'}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-secondary bg-secondary/10 px-2 py-1 rounded-md">{challenge.duration}s</span>
                      </div>
                      <h3 className="font-headline text-lg font-bold text-primary mb-2">{challenge.title}</h3>
                      <p className="text-sm text-on-surface-variant font-body leading-relaxed flex-1 mb-4">{challenge.prompt}</p>
                      
                      <div className="bg-surface-variant/50 p-3 rounded-xl mb-5 flex gap-2 items-start">
                        <Lightbulb className="text-tertiary text-lg mt-0.5" />
                        <p className="text-xs text-on-surface-variant italic leading-relaxed">{challenge.hint}</p>
                      </div>

                      <button
                        onClick={() => startChallenge(challenge)}
                        className={`w-full py-3 rounded-xl font-headline font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${isCompleted ? 'bg-surface-container-high text-primary hover:bg-surface-dim' : 'bg-surface-container-highest text-primary hover:bg-surface-dim'}`}
                      >
                        <span className="material-symbols-outlined text-lg">{isCompleted ? 'replay' : 'mic'}</span>
                        {isCompleted ? 'Try Again' : 'Start'}
                      </button>
                    </div>
                  )})}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-primary/5"></div>
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center relative z-10">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                <h3 className="font-headline text-2xl font-bold text-primary">Analyzing your speech...</h3>
                <p className="text-sm text-on-surface-variant mt-2 text-center">Checking pacing, tone, and filler words.</p>
              </div>
            ) : (
              <div className="relative z-10 w-full flex flex-col items-center">
                <span className="font-label text-xs uppercase tracking-widest text-secondary font-bold mb-4 block">Current Prompt</span>
                <h2 className="font-headline text-2xl font-extrabold text-primary text-center max-w-xl mb-10 leading-tight">
                  "{activeChallengeData?.prompt}"
                </h2>
                
                <div className="relative flex items-center justify-center mb-10">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle className="text-surface-container-high" cx="80" cy="80" fill="transparent" r="72" stroke="currentColor" strokeWidth="8"></circle>
                    <circle 
                      className="text-error transition-all duration-1000 ease-linear drop-shadow-md" 
                      cx="80" cy="80" fill="transparent" r="72" stroke="currentColor" 
                      strokeDasharray="452.39" 
                      strokeDashoffset={452.39 - (452.39 * (timeLeft / (activeChallengeData?.duration || 1)))} 
                      strokeLinecap="round" strokeWidth="8"
                    ></circle>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="font-mono text-5xl font-bold text-primary tracking-tighter">{timeLeft}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Seconds</span>
                  </div>
                </div>

                <button
                  onClick={stopChallenge}
                  className="px-8 py-4 rounded-2xl font-headline font-bold text-sm bg-error text-on-error hover:bg-error/90 transition-all active:scale-95 flex items-center gap-2 shadow-xl"
                >
                  <StopCircle className="text-lg" />
                  Finish Early
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
