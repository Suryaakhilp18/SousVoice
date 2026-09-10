import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat } from 'lucide-react';
import { useSousVoiceStore } from '../store/useSousVoiceStore';
import { getTranslation } from '../services/localization';

interface ConnectingScreenProps {
  onCancel: () => void;
}

export const ConnectingScreen: React.FC<ConnectingScreenProps> = ({ onCancel }) => {
  const { language } = useSousVoiceStore();
  const t = getTranslation(language);

  return (
    <div
      className="flex flex-col items-center justify-center flex-1 w-full max-w-md mx-auto py-12 px-4 text-center gap-6"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex items-center justify-center w-28 h-28">
        {/* Animated concentric loader rings */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-kitchen-amber/20 border-t-kitchen-amber"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-3 rounded-full border-4 border-kitchen-terracotta/20 border-b-kitchen-terracotta"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
        <div className="w-16 h-16 rounded-full bg-kitchen-surface flex items-center justify-center text-kitchen-amber shadow-md">
          <ChefHat className="w-8 h-8" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-kitchen-text-primary tracking-tight">
          {(t as any).connectingTitle || 'Connecting to SousVoice...'}
        </h2>
        <p className="text-sm sm:text-base text-kitchen-text-secondary mt-1.5 max-w-xs mx-auto">
          {(t as any).connectingSubtitle || 'Initializing voice pipeline, audio transport, and voice channels.'}
        </p>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-2.5 rounded-full text-sm font-bold text-kitchen-text-muted hover:text-kitchen-text-primary bg-kitchen-surface border border-kitchen-border hover:border-kitchen-border-strong transition-all mt-4"
      >
        {(t as any).cancelConnection || 'Cancel Connection'}
      </button>
    </div>
  );
};
