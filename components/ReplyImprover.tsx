import { useStore } from '../store/useStore';
import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { ViewState } from '../types';
import { improveReply } from '../services/geminiService';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface ReplyImproverProps {
  setView: (view: ViewState) => void;
}

export function ReplyImprover({ setView }: ReplyImproverProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ original: string; improved: string; advice: string } | null>(null);

  const handleImprove = async () => {
    const { addToast } = useStore.getState();
    const cleanInput = input.trim();
    if (!cleanInput) return;
    if (cleanInput.length > 500) {
      addToast('Draft is too long. Please keep it under 500 characters.', 'error');
      return;
    }
    const sanitizedInput = cleanInput.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    if (!input.trim()) return;
    setIsLoading(true);
    try {
      const { isPro } = useStore.getState();
      const analysis = await improveReply(input, isPro);
      setResult({
        original: input,
        improved: analysis.improved,
        advice: analysis.advice
      });
      setInput('');

      // Award XP
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentXp = userData.xp || 0;
          const newXp = currentXp + 10; // 10 XP for improving a reply
          const newLevel = Math.floor(newXp / 1000) + 1;

          await updateDoc(userRef, {
            xp: newXp,
            level: newLevel
          });
        }
      }
    } catch (e: any) {
      const { addToast } = useStore.getState();
      addToast(e.message || 'An error occurred improving reply.', 'error');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-6">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 border-b border-outline-variant/20 pb-4">
          <div>
            <span className="font-label text-[10px] uppercase tracking-widest text-tertiary font-bold mb-1 block">Charisma Engine</span>
            <h2 className="font-headline text-2xl font-extrabold tracking-tight text-primary leading-tight">Reply Improver</h2>
            <p className="text-on-surface-variant text-sm mt-1">Turn boring replies into confident, engaging responses.</p>
          </div>
        </header>

        <div className="space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 shadow-sm">
            <label className="block font-headline font-bold text-primary mb-2 text-sm">Your Draft Reply</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type what you want to say..."
              className="w-full h-24 bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none resize-none font-body"
            />
            <button
              onClick={handleImprove}
              disabled={isLoading || !input.trim()}
              className={`mt-3 w-full py-3 rounded-xl font-headline font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
                input.trim() && !isLoading
                  ? 'bg-tertiary text-on-primary shadow-md hover:shadow-lg hover:bg-tertiary/90 active:scale-[0.98]'
                  : 'bg-surface-variant text-on-surface-variant/50 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-on-primary rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-on-primary rounded-full animate-bounce" style={{ animationDelay: '75ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-on-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  Improve Reply
                </>
              )}
            </button>
          </div>

          <div className="space-y-6">
            {result ? (
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-outline-variant/10">
                  <span className="material-symbols-outlined text-tertiary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <h3 className="font-headline text-lg font-bold text-primary">Charismatic Reframe</h3>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <span className="font-label text-[10px] uppercase font-bold text-secondary tracking-widest block mb-1">Original</span>
                    <p className="text-xs text-on-surface-variant italic font-body">"{result.original}"</p>
                  </div>
                  
                  <div className="bg-tertiary/5 p-3 rounded-xl border border-tertiary/10">
                    <span className="font-label text-[10px] uppercase font-bold text-tertiary tracking-widest block mb-1">Improved</span>
                    <p className="text-primary font-medium text-sm font-body leading-relaxed">"{result.improved}"</p>
                  </div>

                  <div>
                    <span className="font-label text-[10px] uppercase font-bold text-primary tracking-widest block mb-1">Why it works</span>
                    <p className="text-xs text-on-surface font-body leading-relaxed">{result.advice}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-secondary font-bold bg-secondary/10 p-3 rounded-xl mt-4">
                  <Star className="text-sm" />
                  +10 XP Earned!
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-outline-variant/20 border-dashed rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center opacity-60">
                <span className="material-symbols-outlined text-3xl text-outline-variant mb-2">edit_note</span>
                <p className="text-on-surface-variant text-sm font-medium">Enter a reply above to see it transformed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
