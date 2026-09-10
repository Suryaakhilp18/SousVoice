import React from 'react';
import type { AppError, SessionStats } from '../types';
import { useSousVoiceStore } from '../store/useSousVoiceStore';
import { AlertTriangle, CheckCircle2, Home, RotateCcw, Sparkles } from 'lucide-react';
import { getTranslation } from '../services/localization';

interface EndedSummaryScreenProps {
  isError: boolean;
  error: AppError | null;
  stats: SessionStats;
  completedStepsCount?: number;
  totalStepsCount?: number;
  onRestart: () => void;
  onTryMockMode: () => void;
}

export const EndedSummaryScreen: React.FC<EndedSummaryScreenProps> = ({
  isError,
  error,
  stats,
  completedStepsCount = 0,
  totalStepsCount = 0,
  onRestart,
  onTryMockMode,
}) => {
  const { recipe, setScreen, language } = useSousVoiceStore();
  const t = getTranslation(language);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s}s`;
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full max-w-lg mx-auto py-8 px-4 text-center gap-6">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-kitchen ${
          isError
            ? 'bg-kitchen-crimson/20 text-kitchen-crimson border-2 border-kitchen-crimson'
            : 'bg-kitchen-emerald/20 text-kitchen-emerald border-2 border-kitchen-emerald'
        }`}
      >
        {isError ? <AlertTriangle className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
      </div>

      <div>
        <h2 className="text-3xl font-extrabold text-kitchen-text-primary tracking-tight">
          {isError ? error?.title || 'Connection Failed' : t.cookingSessionComplete}
        </h2>
        <p className="text-base text-kitchen-text-secondary mt-1 max-w-md mx-auto">
          {isError
            ? 'Voice service could not connect. SousVoice is still fully available — start a new session to cook with AI assistance.'
            : `${t.sessionCompleteDesc} (${recipe.name})`}
        </p>
      </div>

      {/* Error guidance — friendly, no technical details */}
      {isError && (
        <div className="w-full bg-kitchen-surface border-l-4 border-kitchen-amber p-4 rounded-xl text-left text-sm text-kitchen-text-secondary shadow-sm">
          <strong className="block text-kitchen-amber font-bold mb-1">Ready to cook:</strong>
          Start a fresh session — voice recognition and AI answers work great without any extra setup.
        </div>
      )}

      {/* Performance Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
        <div className="p-3 bg-kitchen-surface border border-kitchen-border rounded-xl">
          <span className="block text-xs font-bold uppercase text-kitchen-text-muted">{t.duration}</span>
          <span className="text-xl font-extrabold text-kitchen-text-primary font-mono mt-0.5">
            {formatTime(stats.durationSeconds)}
          </span>
        </div>

        <div className="p-3 bg-kitchen-surface border border-kitchen-border rounded-xl">
          <span className="block text-xs font-bold uppercase text-kitchen-text-muted">{t.turns}</span>
          <span className="text-xl font-extrabold text-kitchen-text-primary font-mono mt-0.5">
            {stats.turnsCount}
          </span>
        </div>

        <div className="p-3 bg-kitchen-surface border border-kitchen-border rounded-xl">
          <span className="block text-xs font-bold uppercase text-kitchen-text-muted">{t.bargeIns}</span>
          <span className="text-xl font-extrabold text-kitchen-crimson font-mono mt-0.5">
            {stats.interruptedCount}
          </span>
        </div>

        <div className="p-3 bg-kitchen-surface border border-kitchen-border rounded-xl">
          <span className="block text-xs font-bold uppercase text-kitchen-text-muted">{t.steps}</span>
          <span className="text-xl font-extrabold text-kitchen-emerald font-mono mt-0.5">
            {completedStepsCount}/{totalStepsCount}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full">
        {isError ? (
          <>
            <button
              type="button"
              onClick={onTryMockMode}
              className="flex items-center justify-center gap-2 w-full h-14 bg-kitchen-amber text-slate-950 font-extrabold text-lg rounded-xl shadow-kitchen-blue-glow transition-all active:scale-95 hover:brightness-110"
            >
              <Sparkles className="w-5 h-5" />
              <span>{t.startCooking}</span>
            </button>

            <button
              type="button"
              onClick={onRestart}
              className="flex items-center justify-center gap-2 w-full h-12 bg-kitchen-surface border-2 border-kitchen-border hover:border-kitchen-amber text-kitchen-text-primary font-bold text-sm rounded-xl transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-kitchen-amber" />
              <span>Try Again</span>
            </button>

            <button
              type="button"
              onClick={() => setScreen('home')}
              className="flex items-center justify-center gap-2 w-full h-12 bg-kitchen-surface border border-kitchen-border hover:bg-kitchen-elevated text-kitchen-text-muted hover:text-kitchen-text-primary font-bold text-sm rounded-xl transition-all"
            >
              <Home className="w-4 h-4" />
              <span>{t.backToHome}</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setScreen('home')}
              className="flex items-center justify-center gap-2 w-full h-14 bg-kitchen-amber text-slate-950 font-extrabold text-lg rounded-xl shadow-kitchen-blue-glow transition-all active:scale-95 hover:brightness-110"
            >
              <Home className="w-5 h-5" />
              <span>{t.backToHome}</span>
            </button>

            <button
              type="button"
              onClick={onRestart}
              className="flex items-center justify-center gap-2 w-full h-12 bg-kitchen-surface border-2 border-kitchen-border hover:border-kitchen-amber text-kitchen-text-primary font-bold text-sm rounded-xl transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-kitchen-amber" />
              <span>{t.restartRecipe}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
