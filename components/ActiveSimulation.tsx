import React, { useState, useEffect, useRef } from 'react';
import { StopCircle, Bot, Send, Brain, ArrowLeft, Star } from 'lucide-react';
import { Scenario, Message, Feedback, Persona } from '../types';
import { generateChatResponse, analyzeMessage, DailyLimitError } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';



export function ActiveSimulation() {
  const { selectedScenario: scenario, selectedPersona: persona, setSessionData, setCurrentView, isPro } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showXp, setShowXp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Note: today's chat-session usage count is enforced and incremented
  // server-side (see enforceUsage in usageService.ts), triggered by this
  // component's very first chat call below (empty history = new session).

  // Initial greeting
  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      try {
        const response = await generateChatResponse(scenario.title, scenario.description, [], "Hello, let's start.", persona?.name, isPro);
        setMessages([{ id: Date.now().toString(), role: 'ai', text: response, timestamp: Date.now() }]);
      } catch (e: any) {
        const { addToast } = useStore.getState();
        if (e instanceof DailyLimitError) {
          addToast(e.message, 'error');
          setCurrentView('paywall');
          return;
        }
        addToast(e.message || 'An error occurred. Please try again.', 'error');
        console.error(e);
        setMessages([{ id: Date.now().toString(), role: 'ai', text: `Error connecting to AI: ${e.message}`, timestamp: Date.now() }]);
      } finally {
        setIsLoading(false);
      }
    };
    initChat();
  }, [scenario]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const { addToast } = useStore.getState();
    const cleanInput = input.trim();
    if (!cleanInput || isLoading) return;
    if (cleanInput.length > 500) {
      addToast('Message is too long. Please keep it under 500 characters.', 'error');
      return;
    }
    // Basic client side sanitization to prevent script tags
    const sanitizedInput = cleanInput.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: sanitizedInput, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Run analysis and chat response in parallel
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const [analysisResult, chatResponse] = await Promise.all([
        analyzeMessage(userMsg.text, scenario.title, scenario.description, isPro),
        generateChatResponse(scenario.title, scenario.description, history, userMsg.text, persona?.name, isPro)
      ]);

      setFeedbacks(prev => [...prev, analysisResult]);
      
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: chatResponse, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
      
      // Trigger floating XP animation
      setShowXp(true);
      setTimeout(() => setShowXp(false), 1500);

    } catch (e: any) {
      const { addToast } = useStore.getState();
      if (e instanceof DailyLimitError) {
        addToast(e.message, 'error');
        setCurrentView('paywall');
        return;
      }
      addToast(e.message || 'An error occurred. Please try again.', 'error');
      console.error(e);
      const errMsgs: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: `Failed to reply: ${e.message}`, timestamp: Date.now() };
      setMessages(prev => [...prev, errMsgs]);
    } finally {
      setIsLoading(false);
    }
  };

  const latestFeedback = feedbacks[feedbacks.length - 1] || { confidence: 0, humor: 0, engagement: 0 };

  return (
    <main className="flex-1 overflow-hidden flex flex-col p-0">
      <header className="flex justify-between items-center p-4 border-b border-outline-variant/10 shrink-0 bg-surface/80 backdrop-blur-md z-10">
         <button onClick={() => setCurrentView('scenario_selection')} aria-label="Go back to scenario selection" className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center hover:bg-surface-variant active:scale-95 transition-all mr-3">
            <ArrowLeft className="text-on-surface" />
         </button>
         <div>
            <h2 className="font-headline font-bold text-lg text-primary">{scenario.title}</h2>
            <div className="flex gap-2 mt-1">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="text-[10px] font-bold text-primary">{latestFeedback.confidence.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                <span className="text-[10px] font-bold text-tertiary">{latestFeedback.humor.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span className="text-[10px] font-bold text-secondary">{latestFeedback.engagement.toFixed(1)}</span>
              </div>
            </div>
         </div>
         <button onClick={() => { setSessionData(messages, feedbacks); setCurrentView('feedback_analysis'); }} aria-label="End Session" className="px-3 py-1.5 rounded-lg font-headline font-bold text-xs bg-error/10 text-error hover:bg-error/20 transition-all active:scale-95 flex items-center gap-1">
            <StopCircle className="text-sm" />
            End
          </button>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Chat Interface */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 custom-scrollbar pb-4">
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                key={msg.id} 
                className={`flex items-end gap-2 max-w-[90%] ${msg.role === 'user' ? 'self-end flex-row-reverse ml-auto' : ''}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mb-1 ${msg.role === 'user' ? 'bg-primary' : 'bg-secondary-container shadow-sm'}`}>
                  <span className={`material-symbols-outlined text-[10px] ${msg.role === 'user' ? 'text-white' : 'text-primary'}`}>
                    {msg.role === 'user' ? 'person' : 'smart_toy'}
                  </span>
                </div>
                <div className={`p-3 px-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'rounded-br-none bg-primary text-on-primary shadow-md' : 'rounded-bl-none bg-surface-container-low text-on-surface border border-outline-variant/10'}`}>
                  <p>{msg.text}</p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-end gap-2 opacity-60"
              >
                <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0 mb-1 shadow-sm">
                  <Bot className="text-primary text-[10px]" />
                </div>
                <div className="flex gap-1 p-2 px-4 bg-surface-container-low rounded-full">
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-primary rounded-full"></motion.div>
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full"></motion.div>
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full"></motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <AnimatePresence>
          {showXp && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -80, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute right-6 bottom-32 z-50 pointer-events-none flex items-center gap-1 bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full font-bold shadow-lg border border-yellow-200"
            >
              <Star className="text-sm" />
              <span>+10 XP</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="w-full p-3 bg-surface-container-lowest border-t border-outline-variant/10 shrink-0">
          {(latestFeedback.advice || latestFeedback.improvedExample) && (
            <div className="mb-3 px-2 flex flex-col gap-1.5">
              {latestFeedback.advice && (
                <p className="text-[11px] text-on-surface-variant italic leading-tight">
                  <span className="font-bold text-tertiary not-italic mr-1">Tip:</span>
                  {latestFeedback.advice}
                </p>
              )}
              {latestFeedback.improvedExample && (
                <p className="text-[11px] text-primary bg-primary/5 p-2 rounded-lg leading-tight border border-primary/10">
                  <span className="font-bold mr-1 inline-flex items-center gap-1">
                    <Brain className="text-[10px]" />
                    Better:
                  </span>
                  "{latestFeedback.improvedExample}"
                </p>
              )}
            </div>
          )}
          <div className="relative bg-surface border border-outline-variant/30 rounded-full p-1.5 flex items-center gap-2 shadow-sm focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <input 
              className="flex-1 bg-transparent border-none focus:ring-0 px-3 py-1.5 text-sm text-on-surface font-body placeholder:text-outline-variant/60 outline-none" 
              placeholder="Type response..." 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              aria-label="Send message"
              disabled={isLoading || !input.trim()}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm shrink-0 ${input.trim() && !isLoading ? 'bg-primary text-on-primary hover:bg-primary-container active:scale-90' : 'bg-surface-variant text-on-surface-variant/50 cursor-not-allowed'}`}>
              <Send className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
