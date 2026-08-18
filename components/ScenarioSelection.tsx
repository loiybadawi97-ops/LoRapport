import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Scenario, Persona, ViewState } from '../types';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Lock } from 'lucide-react';



const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'friendly',
    name: 'Friendly & Receptive',
    description: 'A standard, polite conversation partner.',
    isPremium: false
  },
  {
    id: 'skeptic',
    name: 'The Skeptic',
    description: 'Questions everything. Hard to convince.',
    isPremium: true
  },
  {
    id: 'distracted',
    name: 'Distracted Executive',
    description: 'Always busy. You have 10 seconds to get their attention.',
    isPremium: true
  },
  {
    id: 'hostile',
    name: 'Hostile Client',
    description: 'Aggressive and easily annoyed. High pressure.',
    isPremium: true
  }
];

export const SCENARIOS: Scenario[] = [
  {
    id: 'start_conversation',
    title: 'Start a Conversation',
    description: 'Practice breaking the ice with a stranger at a social event.',
    icon: 'waving_hand'
  },
  {
    id: 'deep_talk',
    title: 'Deep Conversation',
    description: 'Transition from surface-level chatter to meaningful connection.',
    icon: 'water_drop'
  },
  {
    id: 'small_talk',
    title: 'Small Talk',
    description: 'Daily interactions made effortless.',
    icon: 'chat'
  },
  {
    id: 'dating',
    title: 'Dating',
    description: 'Build genuine romantic connection.',
    icon: 'favorite'
  },
  {
    id: 'networking',
    title: 'Networking',
    description: 'Navigate circles with authority.',
    icon: 'groups'
  },
  {
    id: 'interview',
    title: 'Interview',
    description: 'Project confidence and value.',
    icon: 'work'
  },
  {
    id: 'conflict_resolution',
    title: 'Conflict Resolution',
    description: 'De-escalate and find common ground.',
    icon: 'handshake'
  },
  {
    id: 'public_speaking',
    title: 'Public Speaking',
    description: 'Command the room and engage.',
    icon: 'campaign'
  },
  {
    id: 'sales_pitch',
    title: 'Sales Pitch',
    description: 'Persuade and close the deal.',
    icon: 'trending_up'
  },
  {
    id: 'apology',
    title: 'The Apology',
    description: 'Take accountability gracefully.',
    icon: 'volunteer_activism'
  },
  {
    id: 'negotiation',
    title: 'Negotiation',
    description: 'Advocate for your worth.',
    icon: 'balance'
  },
  {
    id: 'feedback',
    title: 'Giving Feedback',
    description: 'Constructive and empathetic critique.',
    icon: 'rate_review'
  },
  {
    id: 'customer_service',
    title: 'Customer Service',
    description: 'Handle difficult clients with grace.',
    icon: 'support_agent'
  },
  {
    id: 'pitching_idea',
    title: 'Pitching an Idea',
    description: 'Convince stakeholders of your vision.',
    icon: 'lightbulb'
  },
  {
    id: 'asking_raise',
    title: 'Asking for a Raise',
    description: 'Negotiate your salary confidently.',
    icon: 'attach_money'
  },
  {
    id: 'breaking_bad_news',
    title: 'Breaking Bad News',
    description: 'Deliver tough information empathetically.',
    icon: 'warning'
  },
  {
    id: 'mentoring',
    title: 'Mentoring',
    description: 'Guide and inspire a junior colleague.',
    icon: 'school'
  }
];

export function ScenarioSelection() {
  const { setSelectedScenario, setSelectedPersona: setStoreSelectedPersona, setCurrentView } = useStore();
    const onSelectScenario = (s: any, p: any) => {
    setSelectedScenario(s);
    setStoreSelectedPersona(p || null);
    setCurrentView('active_simulation');
  };
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [step, setStep] = useState<'scenario' | 'persona'>('scenario');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleStartSession = () => {
    if (!selected && !isCustom) return;
    if (isCustom && !customPrompt.trim()) return;
    
    // Check limits
    if (!userData?.isPro && userData?.dailyChats >= 3) {
      setCurrentView('paywall');
      return;
    }

    if (isCustom && !userData?.isPro) {
      setCurrentView('paywall');
      return;
    }

    setStep('persona');
  };

  const handleConfirmPersona = () => {
    if ((!selected && !isCustom) || !selectedPersona) return;
    
    if (selectedPersona.isPremium && !userData?.isPro) {
      setCurrentView('paywall');
      return;
    }

    if (isCustom) {
      onSelectScenario({
        id: 'custom',
        title: 'Custom Scenario',
        description: customPrompt,
        icon: 'edit'
      }, selectedPersona);
    } else if (selected) {
      onSelectScenario(selected, selectedPersona);
    }
  };

  if (step === 'persona') {
    return (
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col pb-6">
          <button onClick={() => setStep('scenario')} className="absolute top-6 left-6 p-2 bg-surface-container rounded-full text-on-surface hover:bg-surface-variant transition-colors z-10">
            <ArrowLeft className="" />
          </button>
          
          <div className="mb-6 mt-12">
            <p className="font-label text-tertiary font-semibold tracking-widest uppercase text-[10px] mb-1">Step 2</p>
            <h2 className="font-headline text-2xl font-extrabold text-primary tracking-tight mb-2 leading-tight">
              Choose Persona
            </h2>
            <p className="font-body text-on-surface-variant text-xs leading-relaxed opacity-80">
              Who are you talking to? Pro users can unlock tough personas.
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {DEFAULT_PERSONAS.map(persona => (
              <div 
                key={persona.id}
                onClick={() => setSelectedPersona(persona)}
                className={`group relative flex items-center p-4 rounded-2xl transition-all duration-300 border cursor-pointer ${selectedPersona?.id === persona.id ? 'bg-primary-container/10 border-primary shadow-md scale-[1.02]' : 'bg-surface-container-lowest border-outline-variant/20 hover:border-primary/30'}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline font-bold text-sm text-primary mb-1">{persona.name}</h3>
                    {persona.isPremium && !userData?.isPro && <Lock className="w-3 h-3 text-tertiary" />}
                    {persona.isPremium && userData?.isPro && <span className="text-[8px] bg-tertiary text-on-primary px-1.5 py-0.5 rounded uppercase font-bold">PRO</span>}
                  </div>
                  <p className="font-body text-[10px] text-on-surface-variant leading-relaxed">{persona.description}</p>
                </div>
              </div>
            ))}
          </div>
        </main>

        <div className="absolute bottom-0 left-0 w-full p-6 pt-12 bg-gradient-to-t from-surface via-surface to-transparent pointer-events-none flex flex-col justify-end z-20">
          <div className="pointer-events-auto">
            <button 
              disabled={!selectedPersona}
              onClick={handleConfirmPersona}
              className={`w-full font-bold py-4 px-6 rounded-2xl transition-all shadow-[0_-10px_40px_rgba(0,0,0,0.15)] text-sm flex justify-center items-center gap-2 ${selectedPersona ? 'bg-primary text-on-primary hover:bg-primary/90 active:scale-95' : 'bg-surface-variant text-on-surface-variant cursor-not-allowed'}`}>
              {selectedPersona?.isPremium && !userData?.isPro ? 'Unlock with PRO' : 'Start Simulation'}
              <span className="material-symbols-outlined text-lg">{selectedPersona?.isPremium && !userData?.isPro ? 'lock' : 'play_arrow'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <main className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col pb-6">
        <div className="mb-6">
          <p className="font-label text-tertiary font-semibold tracking-widest uppercase text-[10px] mb-1">Training Module</p>
          <h2 className="font-headline text-2xl font-extrabold text-primary tracking-tight mb-2 leading-tight">
            Simulator
          </h2>
          <p className="font-body text-on-surface-variant text-xs leading-relaxed opacity-80">
            Refine your social charisma. Select a scenario to begin.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div 
            onClick={() => { setSelected(null); setIsCustom(true); }}
            className={`col-span-2 group relative flex flex-col p-4 rounded-2xl transition-all duration-300 border cursor-pointer ${isCustom ? 'bg-primary-container/10 border-primary shadow-md scale-[1.02]' : 'bg-surface-container-lowest border-outline-variant/20 hover:border-primary/30 hover:shadow-sm'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${isCustom ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container-highest text-primary group-hover:bg-primary group-hover:text-on-primary'}`}>
                <span className="material-symbols-outlined text-xl">edit_note</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline font-bold text-sm text-primary">Custom Scenario</h3>
                  {!userData?.isPro && <Lock className="w-3 h-3 text-tertiary" />}
                  {userData?.isPro && <span className="text-[8px] bg-tertiary text-on-primary px-1.5 py-0.5 rounded uppercase font-bold">PRO</span>}
                </div>
                <p className="font-body text-[10px] text-on-surface-variant leading-relaxed">Design your own specific situation.</p>
              </div>
            </div>
            
            <AnimatePresence>
              {isCustom && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-2"
                >
                  <textarea 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="E.g., I am negotiating a 15% raise with my boss Sarah who is very data-driven..."
                    className="w-full h-24 p-3 bg-surface rounded-xl border border-outline-variant/30 text-sm font-body text-on-surface focus:ring-1 focus:ring-primary/50 outline-none resize-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {SCENARIOS.map(scenario => (
            <div 
              key={scenario.id}
              onClick={() => { setSelected(scenario); setIsCustom(false); }}
              className={`group relative flex flex-col p-4 rounded-2xl transition-all duration-300 border cursor-pointer ${selected?.id === scenario.id && !isCustom ? 'bg-primary-container/10 border-primary shadow-md scale-[1.02]' : 'bg-surface-container-lowest border-outline-variant/20 hover:border-primary/30 hover:shadow-sm'}`}
            >
              <div className={`mb-3 w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${selected?.id === scenario.id && !isCustom ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container-highest text-primary group-hover:bg-primary group-hover:text-on-primary'}`}>
                <span className="material-symbols-outlined text-xl">{scenario.icon}</span>
              </div>
              <h3 className="font-headline font-bold text-sm text-primary mb-1">{scenario.title}</h3>
              <p className="font-body text-[10px] text-on-surface-variant leading-relaxed">{scenario.description}</p>
            </div>
          ))}
        </div>
      </main>

      <div className="absolute bottom-0 left-0 w-full p-6 pt-12 bg-gradient-to-t from-surface via-surface to-transparent pointer-events-none flex flex-col justify-end z-20">
        <div className="pointer-events-auto shrink-0 flex flex-col justify-between items-start p-6 rounded-3xl bg-primary text-on-primary relative overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.15)] gap-4">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary-container opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10">
            <h4 className="font-headline text-lg font-bold mb-1">Ready for evaluation?</h4>
            <p className="font-body text-xs text-primary-fixed-dim text-opacity-90">AI analysis of tone, pace, and charisma.</p>
          </div>
          <button 
            disabled={(!selected && !isCustom) || (isCustom && !customPrompt.trim())}
            onClick={handleStartSession}
            className={`relative z-10 w-full font-bold py-3 px-6 rounded-xl transition-all shadow-lg text-sm flex justify-center items-center gap-2 ${((selected && !isCustom) || (isCustom && customPrompt.trim())) ? 'bg-white text-primary hover:bg-surface-bright active:scale-95' : 'bg-white/20 text-white/50 cursor-not-allowed'}`}>
            {isCustom && !userData?.isPro ? 'Unlock with PRO' : 'Continue'}
            <span className="material-symbols-outlined text-lg">{isCustom && !userData?.isPro ? 'lock' : 'arrow_forward'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
