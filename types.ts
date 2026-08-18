export type ViewState = 'dashboard' | 'scenario_selection' | 'active_simulation' | 'feedback_analysis' | 'reply_improver' | 'voice_analyzer' | 'speaking_challenges' | 'voice_exercises' | 'paywall' | 'analytics' | 'mindfulness' | 'library' | 'settings';

export interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp: number;
}

export interface Feedback {
    confidence: number;
    humor: number;
    engagement: number;
    advice: string;
    improvedExample: string;
}

export interface Persona {
    id: string;
    name: string;
    description: string;
    isPremium: boolean;
}

export interface Scenario {
    id: string;
    title: string;
    description: string;
    icon: string;
    isPremium?: boolean;
    personas?: Persona[];
}
