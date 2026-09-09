import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChefHat, Home, Settings } from 'lucide-react';
import { useSousVoiceStore } from './store/useSousVoiceStore';
import { HomeLanding } from './components/HomeLanding';
import { PreConnectScreen } from './components/PreConnectScreen';
import { ConnectingScreen } from './components/ConnectingScreen';
import { LiveSessionScreen } from './components/LiveSessionScreen';
import { EndedSummaryScreen } from './components/EndedSummaryScreen';
import { SettingsModal } from './components/SettingsModal';
import { RimeAttributionFooter } from './components/RimeAttributionFooter';
import { endMockSession, startMockSession } from './services/mockSession';

const screenMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25, ease: 'easeOut' as const },
};

export default function App() {
  const {
    screen,
    theme,
    isSettingsOpen,
    error,
    stats,
    recipe,
    completedSteps,
    setScreen,
    setTheme,
    setMockMode,
    setIsSettingsOpen,
    resetSession,
  } = useSousVoiceStore();

  useEffect(() => {
    setMockMode(true);
  }, [setMockMode]);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      if (theme === 'light') {
        root.setAttribute('data-theme', 'light');
        return;
      }
      if (theme === 'dark') {
        root.removeAttribute('data-theme');
        return;
      }
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      if (prefersLight) root.setAttribute('data-theme', 'light');
      else root.removeAttribute('data-theme');
    };

    applyTheme();

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      mq.addEventListener('change', applyTheme);
      return () => mq.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  const handleCancelConnecting = () => {
    endMockSession();
    resetSession();
  };

  const handleStartSession = () => {
    resetSession();
    startMockSession();
  };

  const isError = screen === 'error';

  return (
    <div className={`flex flex-col bg-kitchen-base text-kitchen-text-primary font-sans antialiased selection:bg-kitchen-amber selection:text-slate-950 ${screen === 'live' ? 'h-dvh overflow-hidden' : 'min-h-dvh'}`}>
      <div className={`flex-1 flex flex-col w-full mx-auto px-4 py-4 sm:px-6 ${screen === 'live' ? 'max-w-6xl overflow-hidden' : 'max-w-4xl'}`}>
        {/* Navy Header */}
        <header className="flex-shrink-0 flex items-center justify-between py-2 border-b border-kitchen-border/60 mb-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setScreen('home')}>
            <div className="w-9 h-9 rounded-xl bg-kitchen-amber flex items-center justify-center text-slate-950 font-black shadow-kitchen-blue-glow">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-kitchen-text-primary block leading-none">
                SousVoice
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-kitchen-amber block mt-0.5">
                AI Kitchen Companion
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {screen !== 'home' && (
              <button
                type="button"
                onClick={() => setScreen('home')}
                className="px-3 py-1.5 rounded-xl bg-kitchen-surface hover:bg-kitchen-elevated border border-kitchen-border text-xs font-bold text-kitchen-text-muted hover:text-kitchen-text-primary flex items-center gap-1.5 transition-all"
              >
                <Home className="w-3.5 h-3.5 text-kitchen-amber" />
                <span className="hidden sm:inline">Recipes</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Open settings"
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-kitchen-surface border border-kitchen-border text-kitchen-text-muted hover:text-kitchen-text-primary transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {screen === 'home' && (
            <motion.div key="home" {...screenMotion} className="flex flex-1 flex-col">
              <HomeLanding />
            </motion.div>
          )}

          {screen === 'pre-connect' && (
            <motion.div key="pre-connect" {...screenMotion} className="flex flex-1 flex-col">
              <PreConnectScreen
                onStart={startMockSession}
              />
            </motion.div>
          )}

          {screen === 'connecting' && (
            <motion.div key="connecting" {...screenMotion} className="flex flex-1 flex-col">
              <ConnectingScreen onCancel={handleCancelConnecting} />
            </motion.div>
          )}

          {screen === 'live' && (
            <motion.div key="live" {...screenMotion} className="flex flex-1 flex-col min-h-0 overflow-hidden">
              <LiveSessionScreen />
              <RimeAttributionFooter />
            </motion.div>
          )}

          {(screen === 'ended' || isError) && (
            <motion.div key="ended" {...screenMotion} className="flex flex-1 flex-col">
              <EndedSummaryScreen
                isError={isError}
                error={error}
                stats={stats}
                completedStepsCount={completedSteps.length}
                totalStepsCount={recipe.steps.length}
                onRestart={resetSession}
                onTryMockMode={handleStartSession}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        theme={theme}
        onClose={() => setIsSettingsOpen(false)}
        onSetTheme={setTheme}
      />
    </div>
  );
}
