export type AgentVoiceState =
  | 'idle'
  | 'listening'
  | 'user-speaking'
  | 'thinking'
  | 'speaking'
  | 'interrupted';

export type AppScreen = 'home' | 'pre-connect' | 'connecting' | 'live' | 'ended' | 'error';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface TranscriptMessage {
  id: string;
  speaker: 'cook' | 'agent';
  text: string;
  timestamp: number;
  isFinal: boolean;
  interrupted?: boolean;
  interruptedReason?: 'vad' | 'explicit-stop';
  queued?: boolean;
}

export interface Recipe {
  name: string;
  cuisine?: string;
  servings: number;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  ingredients: string[];
  steps: string[];
  substitutions: Record<string, string>;
  quantities: Record<string, string>;
  sourceUrl?: string;
  imageUrl?: string;
  notes?: string[];
}

export interface SessionStats {
  turnsCount: number;
  interruptedCount: number;
  startTime: number;
  durationSeconds: number;
}

export interface AppError {
  title: string;
  message: string;
  actionableStep: string;
  recoverable?: boolean;
}
