import React from 'react';
import { LayoutDashboard, MessageCircle, Mic, Timer, BookOpen, Settings } from 'lucide-react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export function BottomNav({ currentView, setView }: BottomNavProps) {
  return (
    <nav className="shrink-0 w-full z-50 bg-surface/90 backdrop-blur-lg border-t border-outline-variant/10 flex md:hidden justify-around items-center px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <NavItem 
        icon={<LayoutDashboard className="w-5 h-5" />} 
        label="Home" 
        active={currentView === 'dashboard'} 
        onClick={() => setView('dashboard')} 
      />
      <NavItem 
        icon={<MessageCircle className="w-5 h-5" />} 
        label="Practice" 
        active={currentView === 'scenario_selection' || currentView === 'active_simulation' || currentView === 'feedback_analysis'} 
        onClick={() => setView('scenario_selection')} 
      />
      <NavItem 
        icon={<Mic className="w-5 h-5" />} 
        label="Voice" 
        active={currentView === 'voice_analyzer' || currentView === 'voice_exercises'} 
        onClick={() => setView('voice_exercises')} 
      />
      <NavItem 
        icon={<Timer className="w-5 h-5" />} 
        label="30s" 
        active={currentView === 'speaking_challenges'} 
        onClick={() => setView('speaking_challenges')} 
      />
      <NavItem 
        icon={<BookOpen className="w-5 h-5" />} 
        label="Learn" 
        active={currentView === 'library'} 
        onClick={() => setView('library')} 
      />
      <NavItem 
        icon={<Settings className="w-5 h-5" />} 
        label="Settings" 
        active={currentView === 'settings'} 
        onClick={() => setView('settings')} 
      />
    </nav>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      aria-label={label}
      className={`flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-2 py-1 ${active ? 'text-primary' : 'text-on-surface-variant/60 hover:text-primary transition-all'}`}
    >
      <div className={`flex items-center justify-center w-12 h-8 rounded-full transition-colors ${active ? 'bg-primary-container/50' : 'bg-transparent'}`}>
        <span className={active ? "text-primary" : "text-on-surface-variant"}>{icon}</span>
      </div>
      <span className={`text-[10px] font-bold ${active ? 'text-primary' : 'text-on-surface-variant/60'}`}>{label}</span>
    </button>
  );
}
