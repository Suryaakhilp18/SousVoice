import { create } from 'zustand';
import type { AgentVoiceState, AppError, AppScreen, Recipe, SessionStats, ThemeMode, TranscriptMessage } from '../types';
import { RECIPE_DATA } from '../data/recipe';
import type { SupportedLanguage } from '../services/localization';
import { scaleIngredientText, calculateScaledTime } from '../services/ingredientScaler';

interface SousVoiceState {
  screen: AppScreen;
  voiceState: AgentVoiceState;
  transcript: TranscriptMessage[];
  currentStep: number;
  completedSteps: number[];
  stats: SessionStats;
  isMuted: boolean;
  isMockMode: boolean;
  micLevel: number;
  theme: ThemeMode;
  language: SupportedLanguage;
  error: AppError | null;
  isSettingsOpen: boolean;

  // Recipe & URL state
  baseRecipe: Recipe;     // Untouched baseline original recipe data
  recipe: Recipe;         // Currently displayed/active recipe (with scaled ingredients/time)
  servings: number;       // Fully dynamic non-negative serving count (0 to infinity)
  isExtracting: boolean;
  extractionStatus: string;

  // Actions
  setScreen: (screen: AppScreen) => void;
  setVoiceState: (voiceState: AgentVoiceState) => void;
  addTranscriptMessage: (msg: TranscriptMessage) => void;
  updateTranscriptMessage: (id: string, updates: Partial<TranscriptMessage>) => void;
  markInterrupted: (targetId?: string, reason?: 'vad' | 'explicit-stop') => void;
  setCurrentStep: (step: number) => void;
  markStepCompleted: (step: number) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  setMicLevel: (level: number) => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: SupportedLanguage) => void;
  setServings: (servings: number) => void;
  setError: (error: AppError | null) => void;
  setMockMode: (mock: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setRecipe: (recipe: Recipe) => void;
  clearRecipeAndSession: (newRecipe?: Recipe) => void;
  setIsExtracting: (extracting: boolean, status?: string) => void;
  resetSession: () => void;
  tickDuration: () => void;
}

const getInitialTheme = (): ThemeMode => {
  try {
    const saved = localStorage.getItem('sousvoice-theme') as ThemeMode | null;
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
  } catch {}
  return 'dark';
};

const getInitialLanguage = (): SupportedLanguage => {
  try {
    const saved = localStorage.getItem('sousvoice-language') as SupportedLanguage | null;
    if (saved === 'en' || saved === 'hi' || saved === 'te') return saved;
  } catch {}
  return 'en';
};

/**
 * Derives a scaled recipe view from the original base recipe without mutating the original.
 */
function deriveScaledRecipe(base: Recipe, targetServings: number): Recipe {
  const baseServings = base.servings || 4;
  const safeTarget = Math.max(0, isNaN(targetServings) ? baseServings : targetServings);

  const scaledIngredients = base.ingredients.map((ing) =>
    scaleIngredientText(ing, safeTarget, baseServings)
  );

  const scaledCookTime = calculateScaledTime(base.cookTime, safeTarget, baseServings);
  const scaledTotalTime = calculateScaledTime(base.totalTime, safeTarget, baseServings);
  const scaledPrepTime = calculateScaledTime(base.prepTime, safeTarget, baseServings);

  return {
    ...base,
    servings: safeTarget,
    ingredients: scaledIngredients,
    cookTime: scaledCookTime,
    totalTime: scaledTotalTime,
    prepTime: scaledPrepTime,
  };
}

export const useSousVoiceStore = create<SousVoiceState>((set, get) => ({
  screen: 'home',
  voiceState: 'idle',
  transcript: [],
  currentStep: 1,
  completedSteps: [],
  stats: {
    turnsCount: 0,
    interruptedCount: 0,
    startTime: 0,
    durationSeconds: 0,
  },
  isMuted: false,
  isMockMode: true,
  micLevel: 0,
  theme: getInitialTheme(),
  language: getInitialLanguage(),
  error: null,
  isSettingsOpen: false,

  baseRecipe: RECIPE_DATA,
  recipe: RECIPE_DATA,
  servings: RECIPE_DATA.servings || 4,
  isExtracting: false,
  extractionStatus: '',

  setScreen: (screen) => set({ screen }),
  setVoiceState: (voiceState) => set({ voiceState }),

  addTranscriptMessage: (msg) => {
    set((state) => ({
      transcript: [...state.transcript, msg],
      stats: {
        ...state.stats,
        turnsCount: state.stats.turnsCount + 1,
      },
    }));
  },

  updateTranscriptMessage: (id, updates) => {
    set((state) => ({
      transcript: state.transcript.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  },

  markInterrupted: (targetId, reason) => {
    set((state) => {
      let updatedTranscript = state.transcript;
      if (targetId) {
        updatedTranscript = state.transcript.map((item) =>
          item.id === targetId
            ? { ...item, interrupted: true, interruptedReason: reason || item.interruptedReason }
            : item
        );
      } else {
        for (let i = state.transcript.length - 1; i >= 0; i--) {
          if (state.transcript[i].speaker === 'agent') {
            updatedTranscript = [
              ...state.transcript.slice(0, i),
              { ...state.transcript[i], interrupted: true, interruptedReason: reason },
              ...state.transcript.slice(i + 1),
            ];
            break;
          }
        }
      }

      return {
        voiceState: 'interrupted',
        transcript: updatedTranscript,
        stats: {
          ...state.stats,
          interruptedCount: state.stats.interruptedCount + 1,
        },
      };
    });
  },

  setCurrentStep: (step) =>
    set((state) => {
      const newCompleted = new Set(state.completedSteps);
      for (let i = 1; i < step; i++) {
        newCompleted.add(i);
      }
      return {
        currentStep: step,
        completedSteps: Array.from(newCompleted),
      };
    }),

  markStepCompleted: (step) => {
    const { completedSteps } = get();
    if (!completedSteps.includes(step)) {
      set({ completedSteps: [...completedSteps, step] });
    }
  },

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setMuted: (muted) => set({ isMuted: muted }),

  setMicLevel: (micLevel) => set({ micLevel }),

  setTheme: (theme) => {
    try {
      localStorage.setItem('sousvoice-theme', theme);
    } catch {}
    set({ theme });
  },

  setLanguage: (language) => {
    try {
      localStorage.setItem('sousvoice-language', language);
    } catch {}
    set({ language });
  },

  setServings: (servingsInput) => {
    const validServings = Math.max(0, isNaN(servingsInput) ? 0 : Math.floor(servingsInput));
    const { baseRecipe } = get();
    const updatedScaledRecipe = deriveScaledRecipe(baseRecipe, validServings);
    set({
      servings: validServings,
      recipe: updatedScaledRecipe,
    });
  },

  setError: (error) => {
    set({
      error,
      screen: error ? 'error' : get().screen === 'error' ? 'home' : get().screen,
      voiceState: error ? 'idle' : get().voiceState,
    });
  },

  setMockMode: (isMockMode) => set({ isMockMode }),
  setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),

  setRecipe: (newRecipe) => {
    const defaultServings = newRecipe.servings || 4;
    set({
      baseRecipe: newRecipe,
      servings: defaultServings,
      recipe: deriveScaledRecipe(newRecipe, defaultServings),
    });
  },

  clearRecipeAndSession: (newRecipe) => {
    const raw = newRecipe || RECIPE_DATA;
    const defaultServings = raw.servings || 4;
    const scaled = deriveScaledRecipe(raw, defaultServings);
    set({
      baseRecipe: raw,
      recipe: scaled,
      servings: defaultServings,
      currentStep: 1,
      completedSteps: [],
      transcript: [],
      voiceState: 'idle',
      error: null,
      stats: {
        turnsCount: 0,
        interruptedCount: 0,
        startTime: Date.now(),
        durationSeconds: 0,
      },
    });
  },

  setIsExtracting: (isExtracting, extractionStatus = '') => {
    set({ isExtracting, extractionStatus });
  },

  resetSession: () => {
    const { baseRecipe, servings } = get();
    set({
      screen: 'home',
      voiceState: 'idle',
      transcript: [],
      currentStep: 1,
      completedSteps: [],
      isMuted: false,
      error: null,
      recipe: deriveScaledRecipe(baseRecipe, servings),
      stats: {
        turnsCount: 0,
        interruptedCount: 0,
        startTime: Date.now(),
        durationSeconds: 0,
      },
    });
  },

  tickDuration: () => {
    set((state) => ({
      stats: {
        ...state.stats,
        durationSeconds: state.stats.durationSeconds + 1,
      },
    }));
  },
}));
