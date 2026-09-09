import React, { useState } from 'react';
import { Mic, MicOff, PhoneOff, Send, Sparkles, Zap } from 'lucide-react';
import { useSousVoiceStore } from '../store/useSousVoiceStore';

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
  const { recipe } = useSousVoiceStore();

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim() || !onSimulateCook) return;
    onSimulateCook(customText.trim());
    setCustomText('');
  };

  return (
    <div className="flex flex-col gap-2.5 w-full" role="toolbar" aria-label="Kitchen voice controls">
      {/* Simulation Quick Chips tailored to dynamic recipe */}
      {isMockMode && onSimulateCook && (
        <div className="flex flex-col gap-2 p-2.5 bg-kitchen-elevated border border-kitchen-border rounded-xl">
          <div className="flex items-center justify-between text-xs font-bold text-kitchen-amber uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Suggested Kitchen Inquiries (or speak naturally):
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onSimulateCook('Can I replace chicken with paneer?')}
              className="px-2.5 py-1.5 bg-kitchen-surface border border-kitchen-border hover:border-kitchen-amber rounded-full text-xs font-semibold text-kitchen-text-primary transition-all active:scale-95"
            >
              🔄 &ldquo;Replace chicken with paneer?&rdquo;
            </button>

            <button
              type="button"
              onClick={() => onSimulateCook('Wait! How much salt again?')}
              className="px-2.5 py-1.5 bg-kitchen-crimson/20 border border-kitchen-crimson text-kitchen-crimson hover:bg-kitchen-crimson/30 rounded-full text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              ⚡ &ldquo;Wait, how much salt?&rdquo; (Interrupt!)
            </button>

            <button
              type="button"
              onClick={() => onSimulateCook('What if I am using an induction stove?')}
              className="px-2.5 py-1.5 bg-kitchen-surface border border-kitchen-border hover:border-kitchen-amber rounded-full text-xs font-semibold text-kitchen-text-primary transition-all active:scale-95"
            >
              ⚡ &ldquo;Induction stove settings?&rdquo;
            </button>

            <button
              type="button"
              onClick={() => onSimulateCook('Next step please')}
              className="px-2.5 py-1.5 bg-kitchen-surface border border-kitchen-border hover:border-kitchen-amber rounded-full text-xs font-semibold text-kitchen-text-primary transition-all active:scale-95"
            >
              ⏩ &ldquo;Next step&rdquo;
            </button>
          </div>

          {/* Text input for quiet testing */}
          <form onSubmit={handleCustomSubmit} className="flex gap-2 mt-0.5">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={`Ask any question about ${recipe.name}...`}
              className="flex-1 bg-kitchen-surface border border-kitchen-border focus:border-kitchen-amber rounded-lg px-3 py-1.5 text-xs sm:text-sm text-kitchen-text-primary placeholder:text-kitchen-text-muted outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-kitchen-amber hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs sm:text-sm flex items-center gap-1 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
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
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-kitchen-amber" />}
          <span>{isMuted ? 'Mic Muted' : 'Mic Active'}</span>
        </button>

        <button
          type="button"
          onClick={onEndSession}
          aria-label="End cooking session"
          className="flex items-center justify-center gap-2.5 h-12 sm:h-13 bg-kitchen-crimson hover:bg-rose-600 text-white rounded-xl text-sm sm:text-base font-bold shadow-kitchen transition-all active:scale-95"
        >
          <PhoneOff className="w-5 h-5" />
          <span>End Cooking</span>
        </button>
      </div>
    </div>
  );
};
