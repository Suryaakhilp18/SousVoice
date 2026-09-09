import React from 'react';
import type { ThemeMode } from '../types';
import { Moon, Sun, X, Monitor, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  theme: ThemeMode;
  onClose: () => void;
  onSetTheme: (theme: ThemeMode) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  theme,
  onClose,
  onSetTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-heading"
    >
      <div className="w-full max-w-md bg-kitchen-surface border-2 border-kitchen-border rounded-3xl p-6 shadow-kitchen text-kitchen-text-primary">
        <div className="flex items-center justify-between pb-4 border-b border-kitchen-border mb-5">
          <h2 id="settings-heading" className="text-xl font-extrabold tracking-tight">
            SousVoice Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-kitchen-elevated hover:bg-kitchen-active text-kitchen-text-muted hover:text-kitchen-text-primary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Chooser */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-kitchen-text-muted mb-2.5">
            Display Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onSetTheme('dark')}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 text-sm font-bold gap-1.5 transition-all ${
                theme === 'dark'
                  ? 'bg-kitchen-amber/20 border-kitchen-amber text-kitchen-amber'
                  : 'bg-kitchen-elevated border-kitchen-border text-kitchen-text-secondary hover:border-kitchen-border-strong'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span>Dark Kitchen</span>
            </button>
            <button
              type="button"
              onClick={() => onSetTheme('light')}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 text-sm font-bold gap-1.5 transition-all ${
                theme === 'light'
                  ? 'bg-kitchen-amber/20 border-kitchen-amber text-kitchen-amber'
                  : 'bg-kitchen-elevated border-kitchen-border text-kitchen-text-secondary hover:border-kitchen-border-strong'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span>Daylight</span>
            </button>
            <button
              type="button"
              onClick={() => onSetTheme('system')}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 text-sm font-bold gap-1.5 transition-all ${
                theme === 'system'
                  ? 'bg-kitchen-amber/20 border-kitchen-amber text-kitchen-amber'
                  : 'bg-kitchen-elevated border-kitchen-border text-kitchen-text-secondary hover:border-kitchen-border-strong'
              }`}
            >
              <Monitor className="w-5 h-5" />
              <span>System</span>
            </button>
          </div>
        </div>

        {/* Optional AI Enhancement Key */}
        <div className="mb-6 p-4 bg-kitchen-elevated border border-kitchen-border rounded-2xl">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-kitchen-text-muted mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-kitchen-amber" />
            <span>AI Enhancement (Optional)</span>
          </label>
          <input
            type="password"
            placeholder="sk-..."
            defaultValue={typeof window !== 'undefined' ? localStorage.getItem('sousvoice_openai_api_key') || '' : ''}
            onChange={(e) => {
              if (typeof window !== 'undefined') {
                const val = e.target.value.trim();
                if (val) localStorage.setItem('sousvoice_openai_api_key', val);
                else localStorage.removeItem('sousvoice_openai_api_key');
              }
            }}
            className="w-full px-3 py-2 text-xs bg-kitchen-surface border border-kitchen-border rounded-xl text-kitchen-text-primary focus:outline-none focus:border-kitchen-amber font-mono"
          />
          <p className="text-[11px] text-kitchen-text-muted mt-1.5">
            Add your OpenAI key for smarter, more personalized cooking answers. Saved locally in your browser.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-kitchen-amber hover:brightness-110 text-slate-950 rounded-xl font-extrabold text-sm transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
};
