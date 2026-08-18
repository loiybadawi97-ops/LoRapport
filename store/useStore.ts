import { create } from 'zustand';
import { ViewState, Scenario, Persona, Message, Feedback } from '../types';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  currentView: ViewState;
  selectedScenario: Scenario | null;
  selectedPersona: Persona | null;
  sessionMessages: Message[];
  sessionFeedbacks: Feedback[];
  currentLevel: number;
  xp: number;
  
  // Auth state
  user: User | null;
  authLoading: boolean;
  isPro: boolean;

  // Toast state
  toasts: Toast[];

  // Actions
  setCurrentView: (view: ViewState) => void;
  setSelectedScenario: (scenario: Scenario | null) => void;
  setSelectedPersona: (persona: Persona | null) => void;
  setSessionData: (messages: Message[], feedbacks: Feedback[]) => void;
  setXp: (xp: number, level: number) => void;
  resetSession: () => void;
  
  // Auth Actions
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setIsPro: (isPro: boolean) => void;
  initializeAuth: () => void;

  // Toast Actions
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentView: 'dashboard',
  selectedScenario: null,
  selectedPersona: null,
  sessionMessages: [],
  sessionFeedbacks: [],
  currentLevel: 1,
  xp: 0,
  user: null,
  authLoading: true,
  isPro: false,
  toasts: [],

  setCurrentView: (view) => set({ currentView: view }),
  setSelectedScenario: (scenario) => set({ selectedScenario: scenario }),
  setSelectedPersona: (persona) => set({ selectedPersona: persona }),
  setSessionData: (messages, feedbacks) => set({ sessionMessages: messages, sessionFeedbacks: feedbacks }),
  setXp: (xp, level) => set({ xp, currentLevel: level }),
  resetSession: () => set({ sessionMessages: [], sessionFeedbacks: [], selectedScenario: null, selectedPersona: null }),
  
  setUser: (user) => set({ user }),
  setAuthLoading: (loading) => set({ authLoading: loading }),
  setIsPro: (isPro) => set({ isPro }),
  
  initializeAuth: () => {
    return onAuthStateChanged(auth, (user) => {
      set({ user, authLoading: false });
    });
  },

  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));

    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  }
}));
