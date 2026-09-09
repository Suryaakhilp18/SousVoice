import React, { useState } from 'react';
import { Volume2, X, Sparkles, Cpu } from 'lucide-react';
import { isLiveAiConfigured } from '../services/cookingAiService';

export const RimeAttributionFooter: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const liveAiActive = isLiveAiConfigured();

  if (dismissed) return null;

  return (
    <footer
      className="flex items-center justify-between gap-3 px-4 py-2.5 bg-kitchen-surface border border-kitchen-border rounded-xl text-xs text-kitchen-text-secondary mt-3"
      aria-label="Speech provider and intelligence attribution"
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="flex items-center gap-1 font-bold text-kitchen-amber">
          <Volume2 className="w-3.5 h-3.5" />
          SousVoice AI
        </span>
        <span className="text-kitchen-text-muted">•</span>
        {liveAiActive ? (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]"
            title="Live OpenAI GPT-4o-mini completion active"
          >
            <Sparkles className="w-3 h-3 text-emerald-500" />
            Live AI Active
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-kitchen-amber/10 text-kitchen-amber font-medium text-[11px]"
            title="Fast deterministic offline culinary engine active"
          >
            <Cpu className="w-3 h-3 text-kitchen-amber" />
            Culinary AI Ready
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss speech provider attribution"
        className="p-1 hover:text-kitchen-text-primary text-kitchen-text-muted rounded-md transition-all"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </footer>
  );
};
