import React, { useState, useRef, useEffect } from 'react';
import { Mic2, Activity, Star } from 'lucide-react';
import { ViewState } from '../types';
import { useStore } from '../store/useStore';
import { analyzeAudio, DailyLimitError } from '../services/geminiService';
import { auth } from '../firebase';
import { awardActivityXp } from '../lib/gamification';

interface VoiceAnalyzerProps {
  setView: (view: ViewState) => void;
}

export function VoiceAnalyzer({ setView }: VoiceAnalyzerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [result, setResult] = useState<{ transcript: string; feedback: string; score: number } | null>(null);
  const timerRef = useRef<number | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
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

        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            // Extract just the base64 part
            const base64Audio = base64data.split(',')[1];

            try {
              const isPro = useStore.getState().isPro;
              const analysis = await analyzeAudio(base64Audio, 'audio/webm', undefined, isPro);
              setResult(analysis);

              // Award XP (also extends today's streak)
              if (auth.currentUser) {
                await awardActivityXp(auth.currentUser.uid, 20);
              }
            } catch (err) {
              if (err instanceof DailyLimitError) {
                useStore.getState().addToast(err.message, 'error');
                setView('paywall');
              } else {
                console.error("Error analyzing audio:", err);
                useStore.getState().addToast('Analysis failed. Please try again.', 'error');
              }
            } finally {
              setIsProcessing(false);
            }
          };
        } catch (error) {
          console.error("Error processing audio:", error);
          setIsProcessing(false);
        }

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setResult(null);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("Error accessing microphone:", err);
      useStore.getState().addToast('Microphone access is required for this feature.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-6">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 border-b border-outline-variant/20 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold mb-1 block">Delivery & Tone</span>
              <h2 className="font-headline text-2xl font-extrabold tracking-tight text-primary leading-tight">Voice Analyzer</h2>
              <p className="text-on-surface-variant text-sm mt-1">Practice pacing and eliminate filler words.</p>
            </div>
            <button 
              onClick={() => setView('voice_exercises')}
              className="bg-secondary/10 text-secondary p-2 rounded-xl hover:bg-secondary/20 transition-colors"
              title="Voice Exercises"
            >
              <Mic2 className="" />
            </button>
          </div>
        </header>

        <div className="space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[250px]">
            <div className={`relative flex items-center justify-center w-24 h-24 rounded-full mb-4 transition-all duration-300 ${isRecording ? 'bg-error/10 scale-110' : 'bg-surface-variant'}`}>
              {isRecording && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-error/30 animate-ping"></div>
                  <div className="absolute inset-[-10px] rounded-full border border-error/20 animate-ping" style={{ animationDelay: '300ms' }}></div>
                </>
              )}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                  isProcessing ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed' :
                  isRecording ? 'bg-error text-on-error hover:bg-error/90' : 'bg-primary text-on-primary hover:bg-primary/90'
                }`}
              >
                <span className="material-symbols-outlined text-3xl">
                  {isProcessing ? 'hourglass_empty' : isRecording ? 'stop' : 'mic'}
                </span>
              </button>
            </div>
            
            <div className="text-center">
              <span className="font-mono text-2xl font-bold text-primary tracking-wider">
                {formatTime(recordingTime)}
              </span>
              <p className="text-xs font-medium text-on-surface-variant mt-1 uppercase tracking-widest">
                {isProcessing ? 'Analyzing audio...' : isRecording ? 'Recording...' : 'Tap to start'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {result ? (
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-outline-variant/10">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                  <h3 className="font-headline text-lg font-bold text-primary">Analysis Results</h3>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center">
                      <svg className="w-12 h-12">
                        <circle className="text-surface-container-high" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="4"></circle>
                        <circle className="text-primary" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeDasharray="125.6" strokeDashoffset={125.6 - (125.6 * result.score) / 100} strokeLinecap="round" strokeWidth="4" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}></circle>
                      </svg>
                      <span className="absolute font-headline text-sm font-bold text-primary">{result.score}</span>
                    </div>
                    <div>
                      <span className="font-label text-[10px] uppercase font-bold text-primary tracking-widest block mb-1">Delivery Score</span>
                      <p className="text-xs text-on-surface-variant font-medium">
                        {result.score >= 80 ? 'Excellent' : result.score >= 60 ? 'Good, but needs work' : 'Needs improvement'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="font-label text-[10px] uppercase font-bold text-secondary tracking-widest block mb-1">Transcript</span>
                    <p className="text-xs text-on-surface italic font-body bg-surface-container-low p-2 rounded-lg border border-outline-variant/10">"{result.transcript}"</p>
                  </div>
                  
                  <div>
                    <span className="font-label text-[10px] uppercase font-bold text-error tracking-widest block mb-1">Feedback</span>
                    <p className="text-xs text-on-surface font-body leading-relaxed">{result.feedback}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-secondary font-bold bg-secondary/10 p-3 rounded-xl mt-4">
                    <Star className="text-sm" />
                    +20 XP Earned!
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-outline-variant/20 border-dashed rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center opacity-60">
                <Activity className="text-3xl text-outline-variant mb-2" />
                <p className="text-on-surface-variant text-sm font-medium">Record your voice for analysis.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
