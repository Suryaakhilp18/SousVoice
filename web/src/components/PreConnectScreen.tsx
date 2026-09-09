import React from 'react';
import { motion } from 'framer-motion';
import { useSousVoiceStore } from '../store/useSousVoiceStore';
import { Clock, Mic, Play, Users, Utensils, Zap } from 'lucide-react';

interface PreConnectScreenProps {
  onStart: () => void;
}

export const PreConnectScreen: React.FC<PreConnectScreenProps> = ({ onStart }) => {
  const { recipe, setScreen } = useSousVoiceStore();

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full max-w-xl mx-auto py-4 px-2 text-center gap-6">
      {/* Recipe Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full bg-kitchen-surface border-2 border-kitchen-border rounded-3xl p-6 sm:p-8 shadow-kitchen relative overflow-hidden"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-kitchen-amber/15 border border-kitchen-amber/40 text-kitchen-amber rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          <Utensils className="w-3.5 h-3.5" />
          <span>Recipe Ready</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-kitchen-text-primary mb-2 leading-tight">
          {recipe.name}
        </h1>

        <div className="flex items-center justify-center gap-2 text-kitchen-text-secondary text-sm sm:text-base font-semibold mb-6 flex-wrap">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4 text-kitchen-amber" />
            {recipe.servings} Servings
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-kitchen-cyan" />
            {recipe.cookTime || '30 min'}
          </span>
          <span>•</span>
          <span>{recipe.steps.length} Steps</span>
        </div>

        {/* What You Can Say */}
        <div className="bg-kitchen-elevated border border-kitchen-border rounded-2xl p-4 text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-kitchen-text-muted block mb-2.5">
            What You Can Ask Hands-Free
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-kitchen-text-secondary font-medium">
            <div className="flex items-start gap-2">
              <span className="text-kitchen-amber">💬</span>
              <span>&ldquo;Can I replace chicken with paneer?&rdquo;</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-kitchen-amber">⚖️</span>
              <span>&ldquo;How much salt or spice?&rdquo;</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-kitchen-cyan">⚡</span>
              <span>&ldquo;What if I use an induction stove?&rdquo;</span>
            </div>
            <div className="flex items-start gap-2 text-kitchen-crimson font-bold">
              <Zap className="w-4 h-4 fill-current shrink-0 mt-0.5" />
              <span>Interrupt anytime — stops audio instantly!</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Primary CTA */}
      <div className="flex flex-col gap-3.5 w-full">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          aria-label="Start cooking session"
          className="flex items-center justify-center gap-3 w-full py-5 bg-kitchen-amber hover:brightness-110 text-slate-950 font-extrabold text-2xl sm:text-3xl rounded-full shadow-kitchen-blue-glow transition-all"
        >
          <Play className="w-7 h-7 fill-current" />
          <span>Start Cooking</span>
        </motion.button>

        <button
          type="button"
          onClick={() => setScreen('home')}
          className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-kitchen-border bg-kitchen-surface text-kitchen-text-muted hover:text-kitchen-text-primary transition-all"
        >
          ← Change Dish / URL
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-kitchen-text-muted max-w-md">
        <Mic className="w-4 h-4 text-kitchen-emerald shrink-0" />
        <span>Hands-free voice commands with instant interruption support.</span>
      </div>
    </div>
  );
};
