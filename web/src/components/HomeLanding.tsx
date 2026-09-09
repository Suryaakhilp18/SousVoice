import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Loader2,
  Search,
  Sparkles,
} from 'lucide-react';
import { useSousVoiceStore } from '../store/useSousVoiceStore';
import { extractRecipeFromUrl } from '../services/recipeExtractor';
import { POPULAR_RECIPES } from '../data/recipe';
import type { Recipe } from '../types';

export const HomeLanding: React.FC = () => {
  const { setScreen, clearRecipeAndSession } = useSousVoiceStore();
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSelectRecipe = (recipe: Recipe) => {
    clearRecipeAndSession(recipe);
    setScreen('pre-connect');
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = urlInput.trim();
    if (!clean) {
      setErrorMessage('Please enter a recipe or dish link.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const recipe = await extractRecipeFromUrl(clean);
      clearRecipeAndSession(recipe);
      setScreen('pre-connect');
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          "Could not access recipe at this URL. Try one of the dishes below or check your URL."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 w-full max-w-4xl mx-auto py-6 px-2 text-center gap-10">
      {/* Background Ambient Culinary Steam Glow (aria-hidden) */}
      <div
        className="absolute top-4 -z-10 pointer-events-none overflow-hidden w-full max-w-2xl h-80 flex justify-center items-center opacity-50 dark:opacity-30 select-none"
        aria-hidden="true"
      >
        <motion.div
          animate={{
            scale: [1, 1.15, 0.95, 1],
            opacity: [0.3, 0.55, 0.35, 0.3],
            y: [-8, 8, -4, -8],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-96 h-96 rounded-full bg-gradient-to-tr from-kitchen-amber/25 via-amber-400/15 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.1, 0.92, 1.18, 1.1],
            opacity: [0.25, 0.45, 0.25, 0.25],
            x: [-12, 12, -8, -12],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-80 h-80 rounded-full bg-gradient-to-br from-orange-400/20 via-yellow-500/10 to-transparent blur-2xl -ml-20"
        />
      </div>

      {/* Hero Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-kitchen-amber/40 bg-kitchen-amber/10 text-kitchen-amber text-xs sm:text-sm font-bold uppercase tracking-wider shadow-kitchen-blue-glow"
      >
        <Sparkles className="w-4 h-4 text-kitchen-amber" />
        <span>Real-Time Voice AI • Hands-Free Cooking Companion</span>
      </motion.div>

      {/* Hero Title & Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4 max-w-2xl"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-kitchen-text-primary leading-[1.15]">
          Turn <span className="text-kitchen-amber">Any Recipe</span> into an Interactive Voice Assistant
        </h1>
        <p className="text-base sm:text-lg text-kitchen-text-secondary leading-relaxed">
          Paste any recipe link or pick a dish. SousVoice extracts the steps, understands every ingredient, answers follow-up questions in real time with conversational memory, and lets you interrupt hands-free.
        </p>
      </motion.div>

      {/* Recipe Link Input Box */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-2xl bg-kitchen-surface border-2 border-kitchen-border focus-within:border-kitchen-amber rounded-2xl p-2.5 sm:p-3 shadow-kitchen transition-all"
      >
        <form onSubmit={handleExtract} className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2.5 flex-1 px-3 py-2 bg-kitchen-elevated rounded-xl">
            <Globe className="w-5 h-5 text-kitchen-amber shrink-0" />
            <input
              type="text"
              inputMode="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Paste recipe or video URL (YouTube, Allrecipes, FoodNetwork...)"
              className="w-full bg-transparent text-kitchen-text-primary placeholder:text-kitchen-text-muted text-sm sm:text-base outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-kitchen-amber hover:bg-sky-400 text-slate-950 font-extrabold text-sm sm:text-base rounded-xl transition-all active:scale-95 disabled:opacity-50 shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Recipe...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Load Recipe</span>
              </>
            )}
          </button>
        </form>

        {errorMessage && (
          <p className="text-xs sm:text-sm text-kitchen-crimson text-left mt-2.5 px-2 font-medium">
            {errorMessage}
          </p>
        )}
      </motion.div>

      {/* Quick Launch Dish Pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-2.5 w-full max-w-2xl"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-kitchen-text-muted">
          Or Quick Test with a Pre-Extracted Dish:
        </span>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectRecipe(POPULAR_RECIPES.biryani)}
            className="px-3.5 py-2 rounded-xl bg-kitchen-surface hover:bg-kitchen-elevated border border-kitchen-border hover:border-kitchen-amber text-xs sm:text-sm font-bold text-kitchen-text-primary flex items-center gap-1.5 transition-all active:scale-95"
          >
            🍗 <span>Chicken Biryani</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRecipe(POPULAR_RECIPES.paneer)}
            className="px-3.5 py-2 rounded-xl bg-kitchen-surface hover:bg-kitchen-elevated border border-kitchen-border hover:border-kitchen-amber text-xs sm:text-sm font-bold text-kitchen-text-primary flex items-center gap-1.5 transition-all active:scale-95"
          >
            🧀 <span>Paneer Butter Masala</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRecipe(POPULAR_RECIPES.pasta)}
            className="px-3.5 py-2 rounded-xl bg-kitchen-surface hover:bg-kitchen-elevated border border-kitchen-border hover:border-kitchen-amber text-xs sm:text-sm font-bold text-kitchen-text-primary flex items-center gap-1.5 transition-all active:scale-95"
          >
            🍝 <span>Garlic Penne Pasta</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRecipe(POPULAR_RECIPES.dosa)}
            className="px-3.5 py-2 rounded-xl bg-kitchen-surface hover:bg-kitchen-elevated border border-kitchen-border hover:border-kitchen-amber text-xs sm:text-sm font-bold text-kitchen-text-primary flex items-center gap-1.5 transition-all active:scale-95"
          >
            🥞 <span>Masala Dosa</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRecipe(POPULAR_RECIPES.ramen)}
            className="px-3.5 py-2 rounded-xl bg-kitchen-surface hover:bg-kitchen-elevated border border-kitchen-border hover:border-kitchen-amber text-xs sm:text-sm font-bold text-kitchen-text-primary flex items-center gap-1.5 transition-all active:scale-95"
          >
            🍜 <span>Shoyu Ramen</span>
          </button>
        </div>
      </motion.div>

      {/* 4-Step "How It Works" Section */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left pt-4">
        <div className="p-4 bg-kitchen-surface border border-kitchen-border rounded-2xl">
          <div className="text-xl font-mono font-bold text-kitchen-amber mb-1">01</div>
          <h3 className="text-base font-bold text-kitchen-text-primary mb-1">Paste Any URL</h3>
          <p className="text-xs text-kitchen-text-muted leading-relaxed">
            Accepts recipe links from any website with JSON-LD schema or structured tables.
          </p>
        </div>

        <div className="p-4 bg-kitchen-surface border border-kitchen-border rounded-2xl">
          <div className="text-xl font-mono font-bold text-kitchen-cyan mb-1">02</div>
          <h3 className="text-base font-bold text-kitchen-text-primary mb-1">AI Understands</h3>
          <p className="text-xs text-kitchen-text-muted leading-relaxed">
            Extracts prep times, ingredient quantities, substitutions, and indexed cooking steps.
          </p>
        </div>

        <div className="p-4 bg-kitchen-surface border border-kitchen-border rounded-2xl">
          <div className="text-xl font-mono font-bold text-kitchen-terracotta mb-1">03</div>
          <h3 className="text-base font-bold text-kitchen-text-primary mb-1">Real-Time Voice</h3>
          <p className="text-xs text-kitchen-text-muted leading-relaxed">
            Instant spoken replies and active mic listening without touching your screen.
          </p>
        </div>

        <div className="p-4 bg-kitchen-surface border border-kitchen-border rounded-2xl">
          <div className="text-xl font-mono font-bold text-kitchen-emerald mb-1">04</div>
          <h3 className="text-base font-bold text-kitchen-text-primary mb-1">Interrupt Anytime</h3>
          <p className="text-xs text-kitchen-text-muted leading-relaxed">
            Sub-millisecond generation-fenced barge-in cancels audio instantly and answers.
          </p>
        </div>
      </div>
    </div>
  );
};
