import React, { useState, useEffect, Suspense, lazy } from 'react';
import { LogIn, Dumbbell } from 'lucide-react';
import { useStore } from './store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { getRankForLevel } from './lib/ranks';
import { auth, db } from './firebase';
import { doc, onSnapshot, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { initializePurchases, loginPurchasesUser } from './services/purchasesService';

const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const ScenarioSelection = lazy(() => import('./components/ScenarioSelection').then(module => ({ default: module.ScenarioSelection })));
const ActiveSimulation = lazy(() => import('./components/ActiveSimulation').then(module => ({ default: module.ActiveSimulation })));
const FeedbackAnalysis = lazy(() => import('./components/FeedbackAnalysis').then(module => ({ default: module.FeedbackAnalysis })));
const ReplyImprover = lazy(() => import('./components/ReplyImprover').then(module => ({ default: module.ReplyImprover })));
const VoiceAnalyzer = lazy(() => import('./components/VoiceAnalyzer').then(module => ({ default: module.VoiceAnalyzer })));
const SpeakingChallenges = lazy(() => import('./components/SpeakingChallenges').then(module => ({ default: module.SpeakingChallenges })));
const VoiceExercises = lazy(() => import('./components/VoiceExercises').then(module => ({ default: module.VoiceExercises })));
const Analytics = lazy(() => import('./components/Analytics').then(module => ({ default: module.Analytics })));
const Mindfulness = lazy(() => import('./components/Mindfulness').then(module => ({ default: module.Mindfulness })));
const Paywall = lazy(() => import('./components/Paywall').then(module => ({ default: module.Paywall })));
const Library = lazy(() => import('./components/Library').then(module => ({ default: module.Library })));
const Settings = lazy(() => import('./components/Settings').then(module => ({ default: module.Settings })));

import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';

export default function App() {
  const { currentView, setCurrentView, selectedScenario, currentLevel, setXp, user, authLoading, initializeAuth, toasts, removeToast, setIsPro } = useStore();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const previousLevelRef = React.useRef(currentLevel);

  useEffect(() => {
    initializePurchases();
    initializeAuth();
    return () => {};
  }, [initializeAuth]);

  useEffect(() => {
    if (!user) return;
    // Link RevenueCat's identity to the signed-in Firebase user so purchases made
    // on this device attach to the right account, and our webhook (which uses the
    // same uid) can update `isPro` on the matching Firestore doc.
    loginPurchasesUser(user.uid).catch(err => console.error('RevenueCat login failed', err));
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const newLevel = data.level || 1;
        setXp(data.xp || 0, newLevel);
        setIsPro(data.isPro || false);
        
        if (newLevel > previousLevelRef.current) {
          setShowLevelUp(true);
          triggerConfetti();
          previousLevelRef.current = newLevel;
        }
      } else {
        // Initialize user if missing
        setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          xp: 0,
          level: 1,
          dailyChallenges: 0,
          lastActiveDate: new Date().toISOString().split('T')[0],
          isPro: false,
          role: 'user'
        }).catch(console.error);
      }
    }, (error) => {
      console.error("Firestore listening error", error);
    });
    return () => unsubscribe();
  }, [user, setXp]);

  const triggerConfetti = async () => {
    const confetti = (await import('canvas-confetti')).default;
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#2663eb', '#3b82f6', '#60a5fa'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#2663eb', '#3b82f6', '#60a5fa'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const handleLogin = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          await signInWithCredential(auth, credential);
        }
      } else {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-variant flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-surface-variant flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-surface p-8 rounded-3xl shadow-2xl text-center space-y-6"
        >
          <Dumbbell className="text-primary text-6xl" />
          <h1 className="font-headline font-extrabold text-3xl text-primary">Social Gym</h1>
          <p className="text-on-surface-variant">Level up your communication skills with AI-powered practice.</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-3"
            aria-label="Sign in with Google"
          >
            <LogIn className="" />
            Sign in with Google
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-surface-variant flex items-center justify-center p-0 sm:p-4 md:p-8 relative">
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
              className={`p-4 rounded-xl shadow-lg font-medium ${
                toast.type === 'error' ? 'bg-red-100 text-red-900 border border-red-200' :
                toast.type === 'success' ? 'bg-green-100 text-green-900 border border-green-200' :
                'bg-surface-container-high text-on-surface'
              } flex items-center gap-3`}
            >
              <span>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} aria-label="Close notification" className="opacity-70 hover:opacity-100">&times;</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-[100vw] h-[100dvh] sm:h-[90dvh] md:max-w-6xl md:aspect-auto sm:max-w-[400px] sm:aspect-[9/16] bg-background text-on-background sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border-0 sm:border-8 border-surface-container-highest relative">
        <Sidebar currentView={currentView} setView={setCurrentView} />
        
        <main className="flex-1 relative overflow-hidden flex flex-col bg-surface" aria-label="Main Content">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                {currentView === 'dashboard' && <Dashboard setView={setCurrentView} />}
                {currentView === 'scenario_selection' && <ScenarioSelection />}
                {currentView === 'active_simulation' && selectedScenario && <ActiveSimulation />}
                {currentView === 'feedback_analysis' && <FeedbackAnalysis />}
                {currentView === 'reply_improver' && <ReplyImprover setView={setCurrentView} />}
                {currentView === 'voice_analyzer' && <VoiceAnalyzer setView={setCurrentView} />}
                {currentView === 'speaking_challenges' && <SpeakingChallenges setView={setCurrentView} />}
                {currentView === 'voice_exercises' && <VoiceExercises setView={setCurrentView} />}
                {currentView === 'analytics' && <Analytics setView={setCurrentView} />}
                {currentView === 'mindfulness' && <Mindfulness setView={setCurrentView} />}
                {currentView === 'paywall' && <Paywall onClose={() => setCurrentView('dashboard')} />}
                {currentView === 'library' && <Library setView={setCurrentView} />}
                {currentView === 'settings' && <Settings />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav currentView={currentView} setView={setCurrentView} />

        <AnimatePresence>
          {showLevelUp && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.5, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: -50 }}
                className="bg-surface w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center"
              >
                <h2 className="font-headline font-extrabold text-3xl mb-2">Level {currentLevel}</h2>
                <button onClick={() => setShowLevelUp(false)} className="w-full py-3 rounded-xl font-bold bg-primary text-white">Keep Going</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
