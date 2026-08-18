import React, { useEffect, useMemo, useState } from 'react';
import { Timer, HelpCircle, ShieldCheck, Mic2, X, Crown, MessageCircle, ArrowRight, Lightbulb, Sparkles, HeartPulse, Zap, BookOpen } from 'lucide-react';
import { ViewState } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { getRankForLevel } from '../lib/ranks';
import { useStore } from '../store/useStore';
import { syncDailyUsage } from '../services/geminiService';
import { SCENARIOS } from './ScenarioSelection';

interface DashboardProps {
  setView: (view: ViewState) => void;
}

export function Dashboard({ setView }: DashboardProps) {
  const [userData, setUserData] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const { setSelectedScenario, setSelectedPersona } = useStore();

  // Rotates daily (same day-of-year technique as Speaking Challenges) instead
  // of being a permanently static card, so there's a fresh reason to open the
  // app each day.
  const dailyMission = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    return SCENARIOS[dayOfYear % SCENARIOS.length];
  }, []);

  const acceptDailyMission = () => {
    setSelectedScenario(dailyMission);
    setSelectedPersona(null);
    setView('active_simulation');
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    // Resets today's usage counters server-side if a new day has started, so
    // "Daily Limits" below shows fresh numbers immediately rather than
    // waiting for the user's first AI call of the day to trigger the reset.
    syncDailyUsage();

    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        // Show tutorial if it's a brand new user (0 XP) and they haven't seen it yet
        if (data.xp === 0 && !localStorage.getItem('hasSeenTutorial')) {
          setShowTutorial(true);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    return () => unsubscribe();
  }, []);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  const xp = userData?.xp || 0;
  const level = userData?.level || 1;
  const streak = userData?.streak || 0;
  const displayName = userData?.displayName || 'User';
  const isPro = userData?.isPro || false;
  const dailyChats = userData?.dailyChats || 0;
  const dailyExercises = userData?.dailyExercises || 0;
  const dailyChallenges = userData?.dailyChallenges || 0;
  const nextLevelXp = level * 1000;
  const progress = Math.min(100, (xp / nextLevelXp) * 100);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const currentRank = getRankForLevel(level);

  const badges = [
    { id: 'first_step', title: 'First Step', icon: 'directions_walk', earned: xp > 0, desc: 'Earned your first XP' },
    { id: 'on_fire', title: 'On Fire', icon: 'local_fire_department', earned: streak >= 3, desc: '3-day streak' },
    { id: 'challenger', title: 'Challenger', icon: 'emoji_events', earned: (userData?.completedChallenges?.length || 0) >= 1, desc: 'Completed a challenge' },
    { id: 'rising_star', title: 'Rising Star', icon: 'stars', earned: level >= 5, desc: 'Reached Level 5' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-6 relative">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
        <motion.header variants={itemVariants} className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-label text-xs font-bold tracking-[0.15em] text-secondary uppercase">{greeting()}, {displayName.split(' ')[0]}</span>
                {isPro && (
                  <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    PRO
                  </span>
                )}
                <div className="flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 rounded-full" title="Data synced to cloud securely">
                   <ShieldCheck className="text-[10px] text-primary" />
                </div>
              </div>
              <h2 className="font-headline font-extrabold text-3xl text-primary leading-tight mt-1">Keep growing.</h2>
            </div>
            <div className="flex items-center gap-3">
              {!isPro && (
                <button onClick={() => setView('paywall')} className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-primary/20 transition-colors flex items-center gap-1">
                  <Crown className="text-sm" />
                  Upgrade
                </button>
              )}
              {streak > 0 && (
                <motion.div 
                  initial={{ scale: 0.9 }} 
                  animate={{ scale: [0.9, 1.1, 1] }} 
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-xl shadow-lg border border-orange-400/30"
                >
                  <motion.span 
                    animate={{ rotate: [-10, 10, -10] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="material-symbols-outlined text-sm" 
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    local_fire_department
                  </motion.span>
                  <span className="font-black text-xs tracking-wide">{streak} Day{streak > 1 ? 's' : ''}</span>
                </motion.div>
              )}
              <button onClick={() => setShowTutorial(true)} className="w-8 h-8 rounded-full bg-surface-container-high text-primary flex items-center justify-center hover:bg-surface-variant transition-colors">
                <HelpCircle className="text-sm" />
              </button>
              {userData?.photoURL && (
                <img src={userData.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-primary/20" referrerPolicy="no-referrer" />
              )}
            </div>
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`bg-gradient-to-br ${currentRank.bgGradient} p-5 rounded-3xl flex flex-col gap-4 border ${currentRank.border} shadow-md relative overflow-hidden`}
          >
            <div className={`absolute -right-8 -top-8 opacity-20 w-56 h-56 ${currentRank.color} blur-2xl`}>
              {currentRank.icon}
            </div>
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-4">
                <motion.div 
                  initial={{ rotate: -10 }}
                  animate={{ rotate: 10 }}
                  transition={{ repeat: Infinity, duration: 3, repeatType: 'reverse', ease: 'easeInOut' }}
                  className={`w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-md flex items-center justify-center border ${currentRank.border} shadow-lg p-2 ${currentRank.color}`}
                >
                  {currentRank.icon}
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest bg-white/30 px-2 py-0.5 rounded-full w-fit mb-1">Level {level}</span>
                  <span className={`font-headline font-extrabold text-2xl bg-gradient-to-r ${currentRank.textGradient} bg-clip-text text-transparent drop-shadow-sm`}>{currentRank.name}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Total XP</span>
                <div className="text-xl font-black text-primary drop-shadow-sm">{xp}</div>
              </div>
            </div>
            <div className="w-full h-3 bg-surface-container-highest/60 rounded-full overflow-hidden relative z-10 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${currentRank.textGradient} rounded-full relative`}
              >
                <motion.div 
                  animate={{ x: ['-100%', '200%'] }} 
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute top-0 bottom-0 w-16 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
                ></motion.div>
              </motion.div>
            </div>
            <div className="text-[10px] text-primary/80 font-bold text-center z-10 uppercase tracking-widest mt-1">
              {nextLevelXp - xp} XP to Level {level + 1}
            </div>
          </motion.div>
        </motion.header>

        <div className="space-y-6">
          <motion.section variants={itemVariants}>
            <h4 className="font-headline font-bold text-xs text-primary uppercase tracking-wider mb-3">Daily Limits</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                <MessageCircle className="text-primary mb-1 text-xl" />
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Chats</span>
                <span className="font-headline font-bold text-sm text-primary">{isPro ? '∞' : `${dailyChats}/3`}</span>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                <Mic2 className="text-secondary mb-1 text-xl" />
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Exercises</span>
                <span className="font-headline font-bold text-sm text-primary">{isPro ? '∞' : `${dailyExercises}/1`}</span>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                <Timer className="text-error mb-1 text-xl" />
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Challenges</span>
                <span className="font-headline font-bold text-sm text-primary">{isPro ? '∞' : `${dailyChallenges}/3`}</span>
              </div>
            </div>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h4 className="font-headline font-bold text-xs text-primary uppercase tracking-wider mb-3">Your Journey</h4>
            <div className="grid grid-cols-4 gap-2">
              {badges.map(badge => (
                <div key={badge.id} className={`flex flex-col items-center justify-center p-2 rounded-xl border ${badge.earned ? 'bg-primary/10 border-primary/20' : 'bg-surface-container-lowest border-outline-variant/10 opacity-50 grayscale'}`} title={badge.desc}>
                  <span className={`material-symbols-outlined text-2xl mb-1 ${badge.earned ? 'text-primary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: badge.earned ? "'FILL' 1" : "'FILL' 0" }}>{badge.icon}</span>
                  <span className="text-[8px] font-bold text-center leading-tight uppercase tracking-wider">{badge.title}</span>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section variants={itemVariants}>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden bg-gradient-to-r from-primary to-indigo-600 p-6 rounded-3xl text-on-primary shadow-xl"
            >
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-secondary/30 rounded-full blur-2xl"></div>
              <div className="relative z-10 flex flex-col gap-5">
                <div className="flex justify-between items-start">
                  <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full shadow-inner border border-white/10">
                    <Zap className="text-[14px] text-yellow-300" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Daily Mission</span>
                  </div>
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [-5, 0, -5] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="flex items-center gap-1 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold shadow-md"
                  >
                    <span className="text-[10px] uppercase tracking-wider">Earn XP</span>
                  </motion.div>
                </div>

                <div>
                  <h3 className="font-headline font-extrabold text-2xl drop-shadow-sm leading-tight mb-1 text-white">{dailyMission.title}</h3>
                  <p className="text-white/90 text-sm mt-1 font-medium max-w-[240px]">{dailyMission.description}</p>
                </div>

                <button
                  onClick={acceptDailyMission}
                  className="bg-white text-primary px-5 py-3.5 rounded-xl font-headline font-bold text-sm hover:bg-surface-bright transition-all flex items-center justify-between shadow-[0_5px_15px_rgba(0,0,0,0.2)] active:scale-95 mt-2 overflow-hidden relative group">
                  <span className="relative z-10 flex items-center gap-2">
                    Accept Challenge
                    <ArrowRight className="text-lg group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700"></div>
                </button>
              </div>
            </motion.div>
          </motion.section>

          <motion.section variants={itemVariants} className="space-y-4">
            <h4 className="font-headline font-bold text-xs text-primary uppercase tracking-wider">Quick Access</h4>
            <div className="grid grid-cols-2 gap-3">
              <div onClick={() => setView('mindfulness')} className="col-span-2 group cursor-pointer bg-gradient-to-r from-[#0A1A17] to-primary/80 p-4 rounded-2xl flex items-center justify-between border border-primary/20 shadow-md hover:shadow-lg transition-all text-white overflow-hidden relative">
                <div className="absolute right-0 top-0 w-32 h-32 bg-primary/30 rounded-full blur-3xl"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
                    <HeartPulse className="text-xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-headline font-bold text-base text-white">Nervous System Reset</h5>
                      <span className="text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded text-yellow-300">+10 XP</span>
                    </div>
                    <p className="text-[10px] text-white/70 mt-0.5">Pre-conversation breathing</p>
                  </div>
                </div>
                <ArrowRight className="text-white/40 group-hover:text-white transition-colors group-hover:translate-x-1 relative z-10" />
              </div>

              <div onClick={() => setView('scenario_selection')} className="col-span-2 group cursor-pointer bg-surface-container-lowest p-4 rounded-2xl flex items-center justify-between border border-outline-variant/20 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-inner">
                    <MessageCircle className="text-xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-headline font-bold text-base text-primary">Practice Chat</h5>
                      <span className="text-[9px] font-bold bg-yellow-400/20 text-yellow-700 px-1.5 py-0.5 rounded">+10-100 XP</span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Simulate real-world scenarios</p>
                  </div>
                </div>
                <ArrowRight className="text-primary/40 group-hover:text-primary transition-colors group-hover:translate-x-1" />
              </div>
              
              <div onClick={() => setView('voice_exercises')} className="col-span-2 group cursor-pointer bg-surface-container-lowest p-4 rounded-2xl flex items-center justify-between border border-outline-variant/20 shadow-sm hover:shadow-md transition-all active:scale-95">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-white shadow-inner">
                    <Mic2 className="text-xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-headline font-bold text-base text-primary">Voice Exercises</h5>
                      <span className="text-[9px] font-bold bg-yellow-400/20 text-yellow-700 px-1.5 py-0.5 rounded">+20 XP</span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Improve tonality and charisma</p>
                  </div>
                </div>
                <ArrowRight className="text-primary/40 group-hover:text-primary transition-colors group-hover:translate-x-1" />
              </div>
              
              <div onClick={() => setView('library')} className="col-span-2 group cursor-pointer bg-surface-container-lowest p-4 rounded-2xl flex items-center justify-between border border-outline-variant/20 shadow-sm hover:shadow-md transition-all active:scale-95">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center text-white shadow-inner">
                    <BookOpen className="text-xl" />
                  </div>
                  <div>
                    <h5 className="font-headline font-bold text-base text-primary">Social Library</h5>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Learn conversation topics & techniques</p>
                  </div>
                </div>
                <ArrowRight className="text-primary/40 group-hover:text-primary transition-colors group-hover:translate-x-1" />
              </div>
              <div onClick={() => setView('reply_improver')} className="group cursor-pointer bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-sm hover:shadow-md transition-all active:scale-95">
                <Sparkles className="text-tertiary mb-2 text-xl" />
                <h5 className="font-headline font-bold text-xs text-primary">Reply Improver</h5>
              </div>
              
              <div onClick={() => setView('speaking_challenges')} className="group cursor-pointer bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-sm hover:shadow-md transition-all active:scale-95">
                <Timer className="text-secondary mb-2 text-xl" />
                <h5 className="font-headline font-bold text-xs text-primary">30s Challenge</h5>
              </div>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="bg-primary-container/30 p-5 rounded-2xl border border-primary/10 relative overflow-hidden">
            <Lightbulb className="absolute -right-2 -bottom-2 text-6xl text-primary/5" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-2">Pro Tip</p>
            <p className="font-headline text-xs italic font-medium leading-relaxed text-primary relative z-10">"The best conversationalists listen twice as much as they speak. Aim for a 30/70 ratio today."</p>
          </motion.section>
        </div>
      </motion.div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-surface w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="p-6 bg-primary text-on-primary relative">
              <button onClick={closeTutorial} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <X className="text-sm" />
              </button>
              <h3 className="font-headline text-2xl font-extrabold mb-1">Welcome to Social Gym</h3>
              <p className="text-sm text-on-primary/80">Your daily workout for communication skills.</p>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <MessageCircle className="" />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-sm text-primary">1. Practice Chat</h4>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Simulate real-world scenarios (dating, networking, interviews) with an AI persona. Get instant feedback on your confidence, humor, and engagement.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                  <Mic2 className="" />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-sm text-primary">2. Voice Exercises</h4>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Your vocal cords are muscles. Complete daily guided exercises to improve your resonance, tonality, and speaking charisma. Build your streak!</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-error/10 flex items-center justify-center text-error">
                  <Timer className="" />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-sm text-primary">3. 30s Challenges</h4>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Pressure testing. You get a new set of impromptu speaking prompts every day. Learn to think on your feet and deliver concise answers.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                  <Sparkles className="" />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-sm text-primary">4. Reply Improver</h4>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Not sure what to text back? Paste their message and your draft, and the AI will suggest a more charismatic, engaging reply.</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest">
              <button 
                onClick={closeTutorial}
                className="w-full py-3 rounded-xl font-headline font-bold text-sm bg-primary text-on-primary hover:bg-primary/90 transition-all active:scale-95"
              >
                Let's Get Started
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
