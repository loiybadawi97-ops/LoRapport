import React from 'react';

export interface Rank {
  name: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  textGradient: string;
  border: string;
}

const BronzeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="currentColor" fillOpacity="0.4"/>
    <path d="M12 4.5l-6 3v5.5c0 4.5 3 8.5 6 9.8 3-1.3 6-5.3 6-9.8v-5.5l-6-3z" fill="currentColor" fillOpacity="0.8"/>
    <path d="M12 7l-4 2v4.5c0 3 2 6 4 7.2 2-1.2 4-4.2 4-7.2V9l-4-2z" fill="currentColor"/>
    <path d="M12 2v22c4.16-1.26 8-6.45 8-12V6l-8-4z" fill="white" fillOpacity="0.1"/>
  </svg>
);

const SilverIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1l2.5 7.5L22 11l-7.5 2.5L12 21l-2.5-7.5L2 11l7.5-2.5L12 1z" fill="currentColor" fillOpacity="0.4"/>
    <path d="M12 4l1.5 5.5L19 11l-5.5 1.5L12 18l-1.5-5.5L5 11l5.5-1.5L12 4z" fill="currentColor" fillOpacity="0.8"/>
    <circle cx="12" cy="11" r="2.5" fill="currentColor"/>
    <path d="M12 1v20c3.5-3 8-7 8-9s-4.5-6-8-11z" fill="white" fillOpacity="0.15"/>
  </svg>
);

const GoldIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M3 10l4 2 5-6 5 6 4-2v10H3V10z" fill="currentColor" fillOpacity="0.5"/>
    <path d="M5 12l3 1.5 4-4.5 4 4.5 3-1.5v6H5v-6z" fill="currentColor" fillOpacity="0.8"/>
    <path d="M8 15h8v2H8v-2z" fill="currentColor"/>
    <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
    <circle cx="7" cy="9" r="1" fill="currentColor"/>
    <circle cx="17" cy="9" r="1" fill="currentColor"/>
    <path d="M12 6v14h8V10l-4 2-4-6z" fill="white" fillOpacity="0.15"/>
  </svg>
);

const DiamondIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1L2 8l10 14L22 8 12 1z" fill="currentColor" fillOpacity="0.4"/>
    <path d="M12 3l-8 5.5L12 20l8-11.5L12 3z" fill="currentColor" fillOpacity="0.7"/>
    <path d="M12 5l-5 4 5 9 5-9-5-4z" fill="currentColor"/>
    <path d="M6 9h12M12 1L6 9M12 1l6 8" stroke="white" strokeWidth="1" strokeOpacity="0.5"/>
    <path d="M12 1v20l10-13-10-7z" fill="white" fillOpacity="0.15"/>
  </svg>
);

const ApexIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2c0 0-6 4-6 10s6 10 6 10 6-4 6-10-6-10-6-10z" fill="currentColor" fillOpacity="0.3"/>
    <path d="M12 5c0 0-4 3.5-4 7.5s4 7.5 4 7.5 4-3.5 4-7.5S12 5 12 5z" fill="currentColor" fillOpacity="0.7"/>
    <path d="M12 8c0 0-2 2-2 4.5S12 17 12 17s2-2 2-4.5S12 8 12 8z" fill="currentColor"/>
    <path d="M12 0c1 3.5 4.5 5 7.5 5-2 .5-3 2.5-3 4.5C18.5 7 21 6 24 9c-3 1-5 4-5 7 2.5-.5 5 1.5 5 4-3-1-5 0-6 2 1.5-2.5 0-5-2-6 1 3 0 5-2 6" fill="currentColor" fillOpacity="0.5"/>
    <path d="M12 0C11 3.5 7.5 5 4.5 5c2 .5 3 2.5 3 4.5C5.5 7 3 6 0 9c3 1 5 4 5 7-2.5-.5-5 1.5-5 4 3-1 5 0 6 2-1.5-2.5 0-5 2-6-1 3 0 5 2 6" fill="currentColor" fillOpacity="0.5"/>
    <path d="M12 2v18c3-2 6-6 6-10S12 2 12 2z" fill="white" fillOpacity="0.15"/>
  </svg>
);

export function getRankForLevel(level: number): Rank {
  if (level < 5) {
    return { 
      name: 'Bronze Novice', 
      icon: <BronzeIcon className="w-full h-full" />, 
      color: 'text-amber-700', 
      bgGradient: 'from-amber-700/20 to-amber-900/10', 
      textGradient: 'from-amber-700 to-amber-900',
      border: 'border-amber-700/30'
    };
  } else if (level < 10) {
    return { 
      name: 'Silver Speaker', 
      icon: <SilverIcon className="w-full h-full" />, 
      color: 'text-slate-400', 
      bgGradient: 'from-slate-400/20 to-slate-600/10', 
      textGradient: 'from-slate-400 to-slate-600',
      border: 'border-slate-400/30'
    };
  } else if (level < 20) {
    return { 
      name: 'Gold Orator', 
      icon: <GoldIcon className="w-full h-full" />, 
      color: 'text-yellow-500', 
      bgGradient: 'from-yellow-400/20 to-yellow-600/10', 
      textGradient: 'from-yellow-500 to-yellow-600',
      border: 'border-yellow-500/30'
    };
  } else if (level < 50) {
    return { 
      name: 'Diamond Master', 
      icon: <DiamondIcon className="w-full h-full" />, 
      color: 'text-cyan-400', 
      bgGradient: 'from-cyan-400/20 to-blue-600/10', 
      textGradient: 'from-cyan-400 to-blue-500',
      border: 'border-cyan-400/30'
    };
  } else {
    return { 
      name: 'Apex Legend', 
      icon: <ApexIcon className="w-full h-full" />, 
      color: 'text-fuchsia-500', 
      bgGradient: 'from-fuchsia-500/20 to-purple-600/10', 
      textGradient: 'from-fuchsia-500 to-purple-600',
      border: 'border-fuchsia-500/30'
    };
  }
}
