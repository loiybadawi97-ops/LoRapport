import confetti from 'canvas-confetti';
import React, { useEffect } from 'react';
import { Star } from 'lucide-react';
import { Feedback, Message, ViewState } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { awardActivityXp } from '../lib/gamification';



export function FeedbackAnalysis() {
  const { sessionMessages: messages, sessionFeedbacks: feedbacks, setCurrentView, resetSession } = useStore();
    const avgConfidence = feedbacks.length ? feedbacks.reduce((acc, f) => acc + f.confidence, 0) / feedbacks.length : 0;
  const avgHumor = feedbacks.length ? feedbacks.reduce((acc, f) => acc + f.humor, 0) / feedbacks.length : 0;
  const avgEngagement = feedbacks.length ? feedbacks.reduce((acc, f) => acc + f.engagement, 0) / feedbacks.length : 0;

  const overallScore = Math.round((avgConfidence + avgHumor + avgEngagement) / 3 * 10);

  useEffect(() => {
    // Trigger confetti
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#2663eb', '#3b82f6', '#60a5fa', '#fbbf24', '#f59e0b']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#2663eb', '#3b82f6', '#60a5fa', '#fbbf24', '#f59e0b']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    const saveSession = async () => {
      if (!auth.currentUser || feedbacks.length === 0) return;

      try {
        const sessionId = Date.now().toString();
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'sessions', sessionId), {
          uid: auth.currentUser.uid,
          scenarioId: 'practice', // In a real app, pass the actual scenario ID
          score: overallScore,
          confidence: Math.round(avgConfidence),
          humor: Math.round(avgHumor),
          engagement: Math.round(avgEngagement),
          createdAt: serverTimestamp()
        });

        // Update user XP, level, and streak (a completed session keeps your streak alive)
        await awardActivityXp(auth.currentUser.uid, overallScore);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'sessions');
      }
    };

    saveSession();
  }, []);

  // Get user messages with their corresponding feedback
  const userMessages = messages.filter(m => m.role === 'user');
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' } }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-6">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.header variants={itemVariants} className="flex flex-col gap-4 border-b border-outline-variant/20 pb-6 items-center text-center">
          <div>
            <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold mb-2 block">Session Complete</span>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-primary leading-tight">Performance</h2>
          </div>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="flex items-center gap-2 text-xl text-white font-black bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 rounded-full shadow-lg"
          >
            <Star className="text-xl text-yellow-300" />
            +{overallScore} XP Earned!
          </motion.div>
          <button
            onClick={() => { resetSession(); setCurrentView('dashboard'); }}
            className="w-full mt-2 py-4 bg-primary text-on-primary rounded-xl font-headline font-bold text-sm shadow-md hover:shadow-lg hover:bg-primary/90 active:scale-95 transition-all duration-200">
            Return to Dashboard
          </button>
        </motion.header>

        <div className="space-y-8">
          <motion.section variants={itemVariants}>
            <h3 className="font-headline text-lg font-bold text-primary mb-3">Overall Scores</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-container-lowest p-3 rounded-2xl flex flex-col items-center justify-center space-y-2 shadow-sm border border-outline-variant/10">
                <div className="relative flex items-center justify-center">
                  <svg className="w-12 h-12">
                    <circle className="text-surface-container-high" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="4"></circle>
                    <motion.circle 
                      initial={{ strokeDashoffset: 125.6 }}
                      animate={{ strokeDashoffset: 125.6 - (125.6 * avgConfidence) / 10 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="text-primary" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeDasharray="125.6" strokeLinecap="round" strokeWidth="4" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    ></motion.circle>
                  </svg>
                  <span className="absolute font-headline text-sm font-bold text-primary">{Math.round(avgConfidence)}</span>
                </div>
                <span className="font-label text-[8px] font-bold text-primary tracking-widest">CONFIDENCE</span>
              </div>
              
              <div className="bg-surface-container-lowest p-3 rounded-2xl flex flex-col items-center justify-center space-y-2 shadow-sm border border-outline-variant/10">
                <div className="relative flex items-center justify-center">
                  <svg className="w-12 h-12">
                    <circle className="text-surface-container-high" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="4"></circle>
                    <motion.circle 
                      initial={{ strokeDashoffset: 125.6 }}
                      animate={{ strokeDashoffset: 125.6 - (125.6 * avgHumor) / 10 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="text-tertiary" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeDasharray="125.6" strokeLinecap="round" strokeWidth="4" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    ></motion.circle>
                  </svg>
                  <span className="absolute font-headline text-sm font-bold text-tertiary">{Math.round(avgHumor)}</span>
                </div>
                <span className="font-label text-[8px] font-bold text-primary tracking-widest">HUMOR</span>
              </div>
              
              <div className="bg-surface-container-lowest p-3 rounded-2xl flex flex-col items-center justify-center space-y-2 shadow-sm border border-outline-variant/10">
                <div className="relative flex items-center justify-center">
                  <svg className="w-12 h-12">
                    <circle className="text-surface-container-high" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="4"></circle>
                    <motion.circle 
                      initial={{ strokeDashoffset: 125.6 }}
                      animate={{ strokeDashoffset: 125.6 - (125.6 * avgEngagement) / 10 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="text-primary" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeDasharray="125.6" strokeLinecap="round" strokeWidth="4" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    ></motion.circle>
                  </svg>
                  <span className="absolute font-headline text-sm font-bold text-primary">{Math.round(avgEngagement)}</span>
                </div>
                <span className="font-label text-[8px] font-bold text-primary tracking-widest">ENGAGEMENT</span>
              </div>
            </div>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h3 className="font-headline text-lg font-bold text-primary mb-3">Direct Feedback</h3>
            <div className="space-y-3">
              {feedbacks.map((feedback, index) => (
                <div key={index} className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-3 flex gap-3 items-start shadow-sm">
                  <div className="w-1 h-full bg-primary self-stretch rounded-full"></div>
                  <div>
                    <span className="block font-headline text-xs font-bold text-primary mb-1">Advice {index + 1}</span>
                    <p className="font-body text-secondary text-xs leading-relaxed">{feedback.advice}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-outline-variant/10">
              <span className="material-symbols-outlined text-tertiary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h3 className="font-headline text-lg font-bold text-primary">Charisma Engine</h3>
            </div>
            <div className="space-y-4">
              {userMessages.map((msg, index) => {
                const feedback = feedbacks[index];
                if (!feedback) return null;
                return (
                  <div key={msg.id} className="overflow-hidden rounded-xl border border-outline-variant/20 shadow-sm">
                    <div className="bg-surface-container-low px-4 py-2 flex flex-col gap-1 border-b border-outline-variant/10">
                      <span className="font-label text-[10px] uppercase font-bold text-secondary tracking-widest">Original</span>
                      <p className="text-xs text-on-surface italic font-body">"{msg.text}"</p>
                    </div>
                    <div className="bg-surface-container-lowest p-4 relative">
                      <div className="absolute top-2 right-2">
                        <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      </div>
                      <span className="font-label text-[10px] uppercase font-bold text-tertiary tracking-widest block mb-1">Charismatic Reframe</span>
                      <p className="text-primary font-medium text-sm font-body leading-relaxed pr-6">"{feedback.improvedExample}"</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        </div>
      </motion.div>
    </main>
  );
}
