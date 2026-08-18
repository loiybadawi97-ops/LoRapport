import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ViewState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface MindfulnessProps {
  setView: (view: ViewState) => void;
}

type Phase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

export function Mindfulness({ setView }: MindfulnessProps) {
  const [phase, setPhase] = useState<Phase>('inhale');
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute session

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      setTimeLeft(60); // Reset for next time
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isActive) {
      const timings = {
        inhale: 4000,
        hold1: 4000,
        exhale: 6000,
        hold2: 2000
      };

      const nextPhase = {
        inhale: 'hold1',
        hold1: 'exhale',
        exhale: 'hold2',
        hold2: 'inhale'
      } as const;

      timeout = setTimeout(() => {
        setPhase(nextPhase[phase]);
      }, timings[phase]);
    }
    return () => clearTimeout(timeout);
  }, [isActive, phase]);

  const getInstructions = () => {
    switch (phase) {
      case 'inhale': return 'Breathe In';
      case 'hold1': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'hold2': return 'Hold';
    }
  };

  const getScale = () => {
    switch (phase) {
      case 'inhale': return 1.5;
      case 'hold1': return 1.5;
      case 'exhale': return 1;
      case 'hold2': return 1;
    }
  };

  const getDuration = () => {
    switch (phase) {
      case 'inhale': return 4;
      case 'hold1': return 4; // Doesn't change scale, so motion config doesn't matter as much, but keeps state clear
      case 'exhale': return 6;
      case 'hold2': return 2;
    }
  };

  return (
    <main className="flex-1 overflow-hidden flex flex-col p-6 pb-6 bg-[#0A1A17] relative">
      <button onClick={() => setView('dashboard')} className="absolute top-6 left-6 p-2 bg-white/10 rounded-full text-white/70 hover:bg-white/20 transition-colors z-10">
        <X className="" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 space-y-12">
        <div className="space-y-2">
          <h2 className="font-headline text-3xl font-extrabold text-white tracking-tight">Nervous System Reset</h2>
          <p className="text-white/60 font-body text-sm max-w-[250px] mx-auto">Center yourself before high-stakes communication.</p>
        </div>

        <div className="relative w-64 h-64 flex items-center justify-center">
          <AnimatePresence>
            {!isActive ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <button 
                  onClick={() => { setIsActive(true); setPhase('inhale'); }}
                  className="w-24 h-24 rounded-full bg-primary text-white font-headline font-bold shadow-[0_0_40px_rgba(0,106,96,0.4)] hover:scale-105 transition-transform"
                >
                  Start
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative flex items-center justify-center w-full h-full"
              >
                <motion.div 
                  className="absolute w-32 h-32 rounded-full border-2 border-primary/30"
                />
                <motion.div 
                  className="absolute w-32 h-32 rounded-full border border-primary/20"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                />
                <motion.div
                  className="w-32 h-32 bg-primary/20 backdrop-blur-md rounded-full shadow-[0_0_60px_rgba(0,106,96,0.3)] flex items-center justify-center"
                  animate={{ scale: getScale() }}
                  transition={{ duration: getDuration(), ease: "easeInOut" }}
                >
                  <motion.div 
                    className="w-24 h-24 bg-primary/40 rounded-full flex items-center justify-center"
                  >
                    <span className="font-headline font-bold text-white text-lg tracking-wider">
                      {getInstructions()}
                    </span>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white/40 font-mono text-sm tracking-widest"
          >
            00:{timeLeft.toString().padStart(2, '0')}
          </motion.div>
        )}
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/10 to-transparent blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-[#0A1A17] to-transparent"></div>
      </div>
    </main>
  );
}
