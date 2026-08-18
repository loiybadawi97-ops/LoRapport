import React from 'react';
import { Dumbbell, LayoutDashboard, MessageCircle, Mic, Timer, BookOpen, Activity, Sparkles, Star, Settings } from 'lucide-react';
import { ViewState } from '../types';
import { useStore } from '../store/useStore';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export function Sidebar({ currentView, setView }: SidebarProps) {
  const { isPro } = useStore();

  return (
    <aside aria-label="Sidebar Navigation" className="w-64 bg-surface-container-lowest border-r border-outline-variant/10 h-full flex flex-col p-4 shrink-0 hidden md:flex relative overflow-hidden">
      <div className="flex items-center gap-3 mb-8 px-2 mt-2">
        <Dumbbell className="text-primary text-3xl" />
        <h1 className="font-headline font-extrabold tracking-tight text-xl text-primary">Social Gym</h1>
      </div>
      <nav aria-label="Main Navigation" className="flex-1 space-y-2 relative z-10">
        <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => setView('dashboard')} />
        <NavItem icon={<MessageCircle className="w-5 h-5" />} label="Practice" active={currentView === 'scenario_selection' || currentView === 'active_simulation' || currentView === 'feedback_analysis'} onClick={() => setView('scenario_selection')} />
        <NavItem icon={<Mic className="w-5 h-5" />} label="Voice" active={currentView === 'voice_analyzer' || currentView === 'voice_exercises'} onClick={() => setView('voice_exercises')} />
        <NavItem icon={<Timer className="w-5 h-5" />} label="30s Challenges" active={currentView === 'speaking_challenges'} onClick={() => setView('speaking_challenges')} />
        <NavItem icon={<BookOpen className="w-5 h-5" />} label="Learn" active={currentView === 'library'} onClick={() => setView('library')} />
        <NavItem icon={<Activity className="w-5 h-5" />} label="Stats" active={currentView === 'analytics'} onClick={() => setView('analytics')} />
        <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" active={currentView === 'settings'} onClick={() => setView('settings')} />
      </nav>

      <div className="mt-auto relative z-10">
          {!isPro ? (
            <button 
              onClick={() => setView('paywall')} 
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-md hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 fill-white" />
                <span className="font-headline font-bold text-sm">Upgrade to Pro</span>
              </div>
            </button>
          ) : (
            <div className="w-full flex items-center p-4 bg-primary rounded-2xl border border-tertiary shadow-sm">
               <div className="flex items-center gap-2 text-white">
                <Star className="w-5 h-5 fill-tertiary text-tertiary" />
                <span className="font-headline font-bold text-sm">Pro Member</span>
              </div>
            </div>
          )}
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, onClick, disabled }: any) {
  return (
    <button aria-label={label} aria-current={active ? "page" : undefined} onClick={onClick} disabled={disabled} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${active ? 'bg-primary text-on-primary shadow-md' : disabled ? 'text-on-surface-variant/40 cursor-not-allowed' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'}`}>
      <span className={active ? "text-white" : "text-on-surface-variant"}>{icon}</span>
      <span className="font-headline font-bold text-sm">{label}</span>
      {disabled && <span className="ml-auto text-[8px] uppercase tracking-widest bg-surface-variant px-1.5 py-0.5 rounded text-on-surface-variant">Soon</span>}
    </button>
  )
}
