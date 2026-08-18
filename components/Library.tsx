import React, { useState } from 'react';
import { Trophy, CheckCircle2, Sparkles, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewState } from '../types';
import { auth } from '../firebase';
import { useStore } from '../store/useStore';
import { generateLibraryModule } from '../services/geminiService';
import { awardActivityXp } from '../lib/gamification';

interface LibraryProps {
  setView: (view: ViewState) => void;
}

export function Library({ setView }: LibraryProps) {
  const [activeTab, setActiveTab] = useState<'icebreakers' | 'small_talk' | 'deep_talk' | 'ai_custom'>('icebreakers');
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean>>({});
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null);
  const [challengeInput, setChallengeInput] = useState('');

  // AI Generation State
  const [searchTopic, setSearchTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customModules, setCustomModules] = useState<any[]>([]);
  const { user, isPro, addToast } = useStore();

  const handleChallengeSubmit = async (sectionTitle: string, expectedKeyword: string) => {
    // Very basic check, in reality we might want to use AI to evaluate the answer!
    if (challengeInput.toLowerCase().includes(expectedKeyword.toLowerCase()) || expectedKeyword === 'any') {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setCompletedChallenges(prev => ({ ...prev, [sectionTitle]: true }));
      setActiveChallenge(null);
      setChallengeInput('');

      // Award XP (also recomputes level and extends the streak — see gamification.ts)
      if (auth.currentUser) {
        try {
          await awardActivityXp(auth.currentUser.uid, 15);
        } catch (e) {
          console.error("Failed to add XP", e);
        }
      }
    } else {
      addToast(`Not quite — try including the concept of: ${expectedKeyword}`, 'error');
    }
  };

  const handleGenerateModule = async () => {
    if (!searchTopic.trim() || isGenerating) return;
    setIsGenerating(true);
    setActiveTab('ai_custom');

    try {
      const newModule = await generateLibraryModule(searchTopic, isPro);
      if (newModule && newModule.title) {
        setCustomModules(prev => [newModule, ...prev]);
        setSearchTopic('');
      } else {
        addToast('Failed to generate module. Please try again.', 'error');
      }
    } catch (error) {
      console.error(error);
      addToast('Error generating module.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const content = {
    icebreakers: [
      {
        title: 'Situational Openers',
        description: 'The easiest way to start a conversation without being awkward.',
        points: [
          'The Venue: "This place has a great vibe, have you been here before?"',
          'The Wait: (In line) "I hope the coffee here is worth the wait!"'
        ],
        challenge: {
          prompt: "You are at a crowded tech meetup. Write a situational opener you could use while waiting for a drink.",
          expectedKeyword: "wait"
        }
      },
      {
        title: 'Asking for Help/Advice',
        description: 'People love to feel helpful.',
        points: [
          '"I\'m trying to decide between these two drinks, any recommendations?"',
          '"I\'m new to this neighborhood, do you know any good food spots?"'
        ],
        challenge: {
          prompt: "You see someone reading a book by an author you've heard of. Ask for their advice/opinion on it.",
          expectedKeyword: "recommend"
        }
      }
    ],
    small_talk: [
      {
        title: 'The FORD Method',
        description: 'A classic framework for keeping conversations flowing smoothly.',
        points: [
          'Family: "How is your family doing?", "Do you have any siblings?"',
          'Occupation: "What do you do for work?", "How did you get into your field?"',
          'Recreation: "What do you do for fun?", "Any weekend plans?"',
          'Dreams: "Where would you travel if you could go anywhere?", "What are you looking forward to?"'
        ],
        challenge: {
          prompt: "Using the 'Recreation' part of FORD, ask a coworker what they are doing this Saturday.",
          expectedKeyword: "weekend"
        }
      }
    ],
    deep_talk: [
      {
        title: 'Transitioning to Deeper Topics',
        description: 'How to move beyond the surface level.',
        points: [
          'Ask "Why" or "How" questions instead of "What".',
          'Notice when they light up and ask them to expand on that.'
        ],
        challenge: {
          prompt: "Someone just told you they are a software engineer. Instead of asking 'where do you work', ask a 'Why' or 'How' question to go deeper.",
          expectedKeyword: "how"
        }
      }
    ],
    ai_custom: customModules
  };

  const activeContent = content[activeTab] || [];

  return (
    <main className="flex-1 overflow-hidden flex flex-col bg-surface relative">
      <header className="p-6 pb-4 shrink-0 bg-surface z-10 border-b border-outline-variant/10">
        <h2 className="font-headline font-extrabold text-3xl text-primary">Library</h2>
        <p className="text-sm text-on-surface-variant mt-1">Interactive modules for social mastery.</p>
        
        {/* AI Generation Search Bar */}
        <div className="mt-6 flex gap-2 relative">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="What do you want to learn? (e.g. 'Networking for introverts')"
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateModule()}
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-inner"
            />
          </div>
          <button 
            onClick={handleGenerateModule}
            disabled={isGenerating || !searchTopic.trim()}
            className="bg-primary text-on-primary px-4 rounded-xl flex items-center justify-center disabled:opacity-50 transition-all hover:bg-primary/90 active:scale-95 shadow-md"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex bg-surface-container-low rounded-xl p-1 mt-6">
          {(['icebreakers', 'small_talk', 'deep_talk', 'ai_custom'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setActiveChallenge(null); }}
              className={`flex-1 py-2.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all capitalize ${activeTab === tab ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant/50'} ${tab === 'ai_custom' ? 'flex items-center justify-center gap-1' : ''}`}
            >
              {tab === 'ai_custom' && <Sparkles className="w-3 h-3" />}
              {tab === 'ai_custom' ? 'My AI Courses' : tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 pb-12">
        <AnimatePresence mode="wait">
          {activeTab === 'ai_custom' && activeContent.length === 0 && !isGenerating && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center text-on-surface-variant py-12 flex flex-col items-center gap-4"
            >
              <Sparkles className="w-12 h-12 opacity-20" />
              <p>Type a topic above to generate a custom AI learning module!</p>
            </motion.div>
          )}

          {isGenerating && activeTab === 'ai_custom' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm relative overflow-hidden flex flex-col items-center justify-center py-12 gap-4"
            >
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-bold text-primary animate-pulse">Synthesizing course materials...</p>
            </motion.div>
          )}

          <motion.div
            key={activeTab + (isGenerating ? '-gen' : '')}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 max-w-2xl mx-auto w-full"
          >
            {activeContent.map((section: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-lg relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <h3 className="font-headline font-bold text-xl text-primary">{section.title}</h3>
                  {completedChallenges[section.title] && (
                    <span className="bg-green-500/20 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="text-[12px]" /> Mastered
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-on-surface-variant mb-5 leading-relaxed relative z-10">{section.description}</p>
                <ul className="space-y-3 relative z-10 mb-6">
                  {section.points.map((point: string, pIdx: number) => (
                    <li key={pIdx} className="flex gap-3 items-start group">
                      <span className="material-symbols-outlined text-secondary text-base mt-0.5 shrink-0 group-hover:scale-110 transition-transform">school</span>
                      <span className="text-sm text-on-surface leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>

                {/* Challenge Section */}
                <div className="mt-4 pt-4 border-t border-outline-variant/10 relative z-10">
                  {!completedChallenges[section.title] ? (
                    activeChallenge === section.title ? (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                        <p className="text-xs font-bold text-secondary">Test Your Knowledge:</p>
                        <p className="text-sm text-on-surface italic bg-surface-variant p-4 rounded-xl border border-outline-variant/20 shadow-inner">{section.challenge.prompt}</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            className="flex-1 bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-sm"
                            placeholder="Type your response..."
                            value={challengeInput}
                            onChange={(e) => setChallengeInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleChallengeSubmit(section.title, section.challenge.expectedKeyword)}
                          />
                          <button 
                            onClick={() => handleChallengeSubmit(section.title, section.challenge.expectedKeyword)}
                            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md"
                          >
                            Submit
                          </button>
                        </div>
                        <button onClick={() => setActiveChallenge(null)} className="text-xs text-on-surface-variant hover:text-on-surface mt-2">Cancel</button>
                      </motion.div>
                    ) : (
                      <button 
                        onClick={() => setActiveChallenge(section.title)}
                        className="w-full py-4 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/20 transition-all group border border-primary/10"
                      >
                        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">psychology</span>
                        Take Challenge (+15 XP)
                      </button>
                    )
                  ) : (
                    <div className="py-3 flex items-center justify-center gap-2 text-secondary font-bold text-sm bg-secondary/10 rounded-xl border border-secondary/20">
                      <Trophy className="w-5 h-5" />
                      Challenge Completed
                    </div>
                  )}
                </div>

              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

