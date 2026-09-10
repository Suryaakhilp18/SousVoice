import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useSousVoiceStore } from '../store/useSousVoiceStore';
import { getContextualSuggestions } from '../services/suggestionService';
import { getTranslation } from '../services/localization';

interface KitchenControlBarProps {
  isMuted: boolean;
  isMockMode?: boolean;
  onToggleMute: () => void;
  onEndSession: () => void;
  onSimulateCook?: (text: string) => void;
}

export const KitchenControlBar: React.FC<KitchenControlBarProps> = ({
  isMuted,
  isMockMode = false,
  onToggleMute,
  onEndSession,
  onSimulateCook,
}) => {
  const [customText, setCustomText] = useState('');
  const { recipe, currentStep, language } = useSousVoiceStore();
  const t = getTranslation(language);

  // 6 to 8 dynamically contextual suggestions matching the active dish and language
  const suggestions = getContextualSuggestions(recipe, currentStep, language);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim() || !onSimulateCook) return;
    onSimulateCook(customText.trim());
    setCustomText('');
  };

  return (
    <div className="flex flex-col gap-2.5 w-full" role="toolbar" aria-label="Kitchen voice controls">
      {/* Simulation Quick Chips tailored to dynamic recipe & language (6-8 suggestions) */}
      {isMockMode && onSimulateCook && (
        <div className="flex flex-col gap-2 p-2.5 bg-kitchen-elevated border border-kitchen-border rounded-xl">
          <div className="flex items-center justify-between text-xs font-bold text-kitchen-amber uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span>{t.suggestedInquiries}</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {suggestions.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => onSimulateCook(chip.textToSubmit)}
                className={`px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 ${
                  chip.isInterrupt
                    ? 'bg-kitchen-crimson/20 border border-kitchen-crimson text-kitchen-crimson hover:bg-kitchen-crimson/30 font-bold'
                    : 'bg-kitchen-surface border border-kitchen-border hover:border-kitchen-amber text-kitchen-text-primary'
                }`}
              >
                <span>{chip.emoji}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Text input for quiet testing */}
          <form onSubmit={handleCustomSubmit} className="flex gap-2 mt-0.5">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={`${t.askPlaceholder} ${recipe.name}...`}
              className="flex-1 bg-kitchen-surface border border-kitchen-border focus:border-kitchen-amber rounded-lg px-3 py-1.5 text-xs sm:text-sm text-kitchen-text-primary placeholder:text-kitchen-text-muted outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-kitchen-amber hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs sm:text-sm flex items-center gap-1 transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.askButton}</span>
            </button>
          </form>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onToggleMute}
          aria-pressed={isMuted}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          className={`flex items-center justify-center gap-2.5 h-12 sm:h-13 rounded-xl text-sm sm:text-base font-bold border-2 transition-all active:scale-95 ${
            isMuted
              ? 'bg-kitchen-crimson/20 text-kitchen-crimson border-kitchen-crimson'
              : 'bg-kitchen-surface text-kitchen-text-primary border-kitchen-border hover:border-kitchen-border-strong'
          }`}
        >
          <span>{isMuted ? t.micMuted : t.micActive}</span>
        </button>

        <button
          type="button"
          onClick={onEndSession}
          aria-label="End cooking session"
          className="flex items-center justify-center gap-2.5 h-12 sm:h-13 bg-kitchen-crimson hover:bg-rose-600 text-white rounded-xl text-sm sm:text-base font-bold shadow-kitchen transition-all active:scale-95"
        >
          <span>{t.endCooking}</span>
        </button>
      </div>
    </div>
  );
};
