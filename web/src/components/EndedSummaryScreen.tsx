import React from 'react';
import type { AppError, SessionStats } from '../types';
import { useSousVoiceStore } from '../store/useSousVoiceStore';
import { AlertTriangle, CheckCircle2, Home, RotateCcw, Sparkles } from 'lucide-react';

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
  onRestart,
  onTryMockMode,
}) => {
  const { recipe, setScreen } = useSousVoiceStore();

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
          {isError ? error?.title || 'Connection Failed' : 'Cooking Session Complete!'}
        </h2>
        <p className="text-base text-kitchen-text-secondary mt-1 max-w-md mx-auto">
          {isError
            ? 'Voice service could not connect. SousVoice is still fully available — start a new session to cook with AI assistance.'
            : `Bon appétit! All voice interactions for ${recipe.name} were successfully recorded.`}
        </p>
      </div>

      {/* Error guidance — friendly, no technical details */}
      {isError && (
        <div className="w-full bg-kitchen-surface border-l-4 border-kitchen-amber p-4 rounded-xl text-left text-sm text-kitchen-text-secondary shadow-sm">
          <strong className="block text-kitchen-amber font-bold mb-1">Ready to cook:</strong>
          Start a fresh session — voice recognition and AI answers work great without any extra setup.
        </div>
      )}

      {/* Session Performance Metrics */}
      <div className="w-full bg-kitchen-surface border-2 border-kitchen-border rounded-2xl p-5 shadow-kitchen text-left space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-kitchen-text-muted">
          Session Summary • {recipe.name}
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-kitchen-elevated p-3 rounded-xl text-center">
            <span className="text-2xl font-mono font-bold text-kitchen-amber block">
              {stats.turnsCount}
            </span>
            <span className="text-[11px] font-bold text-kitchen-text-muted uppercase">
              Turns Taken
            </span>
          </div>

          <div className="bg-kitchen-elevated p-3 rounded-xl text-center">
            <span className="text-2xl font-mono font-bold text-kitchen-crimson block">
              {stats.interruptedCount}
            </span>
            <span className="text-[11px] font-bold text-kitchen-text-muted uppercase">
              Fenced
            </span>
          </div>

          <div className="bg-kitchen-elevated p-3 rounded-xl text-center">
            <span className="text-2xl font-mono font-bold text-kitchen-cyan block">
              {formatTime(stats.durationSeconds)}
            </span>
            <span className="text-[11px] font-bold text-kitchen-text-muted uppercase">
              Active Time
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col gap-3 w-full">
        {isError ? (
          <>
            {/* Primary CTA when error: restart immediately */}
            <button
              type="button"
              onClick={onTryMockMode}
              className="flex items-center justify-center gap-2 w-full h-14 bg-kitchen-amber text-slate-950 font-extrabold text-lg rounded-xl shadow-kitchen-blue-glow transition-all active:scale-95 hover:brightness-110"
            >
              <Sparkles className="w-5 h-5" />
              <span>Start Cooking</span>
            </button>

            {/* Secondary: retry */}
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
              className="flex items-center justify-center gap-2 w-full h-11 text-kitchen-text-muted hover:text-kitchen-text-primary text-sm font-semibold transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Back to Recipe Selection</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setScreen('home')}
              className="flex items-center justify-center gap-2 w-full h-14 bg-kitchen-surface border-2 border-kitchen-border hover:border-kitchen-amber text-kitchen-text-primary font-bold text-base rounded-xl transition-all active:scale-95"
            >
              <Home className="w-5 h-5 text-kitchen-amber" />
              <span>Select Another Dish / Recipe URL</span>
            </button>

            <button
              type="button"
              onClick={onRestart}
              className="flex items-center justify-center gap-2 w-full h-12 text-kitchen-text-muted hover:text-kitchen-text-primary text-sm font-semibold transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restart This Recipe</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
