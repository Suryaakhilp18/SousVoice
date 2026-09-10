import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Loader2,
  Search,
  Sparkles,
  Languages,
} from 'lucide-react';
import { useSousVoiceStore } from '../store/useSousVoiceStore';
import { extractRecipeFromUrl } from '../services/recipeExtractor';
import { POPULAR_RECIPES } from '../data/recipe';
import type { Recipe } from '../types';
import { getTranslation, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../services/localization';

export const HomeLanding: React.FC = () => {
  const { setScreen, clearRecipeAndSession, language, setLanguage } = useSousVoiceStore();
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const t = getTranslation(language);

  const handleSelectRecipe = (recipe: Recipe) => {
    clearRecipeAndSession(recipe);
    setScreen('pre-connect');
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = urlInput.trim();
    if (!clean) {
      setErrorMessage(language === 'hi' ? 'कृपया कोई रेसिपी लिंक दर्ज करें।' : language === 'te' ? 'దయచేసి ఏదైనా రెసిపీ లింక్‌ను నమోదు చేయండి.' : 'Please enter a recipe or dish link.');
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
          (language === 'hi'
            ? 'इस लिंक से रेसिपी नहीं मिल सकी। कृपया नीचे दी गई डिश चुनें या लिंक जांचें।'
            : language === 'te'
            ? 'ఈ లింక్ నుండి రెసిపీని సేకరించలేకపోయాము. దయచేసి క్రింది వంటకాల్లో ఒకదాన్ని ఎంచుకోండి.'
            : 'Could not access recipe at this URL. Try one of the dishes below or check your URL.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 w-full max-w-4xl mx-auto py-6 px-2 text-center gap-8">
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

      {/* LANGUAGE SELECTOR - PROMINENT ON HOMEPAGE */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-2.5 p-2 bg-kitchen-surface border border-kitchen-border/90 rounded-2xl shadow-kitchen-sm"
        role="region"
        aria-label="Language selection"
      >
        <div className="flex items-center gap-2 px-2 text-xs font-bold text-kitchen-text-muted uppercase tracking-wider">
          <Languages className="w-4 h-4 text-kitchen-amber" />
          <span>{t.selectLanguage}:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]).map((langCode) => {
            const lang = SUPPORTED_LANGUAGES[langCode];
            const isSelected = language === langCode;

            return (
              <button
                key={langCode}
                type="button"
                onClick={() => setLanguage(langCode)}
                aria-pressed={isSelected}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-kitchen-amber text-slate-950 shadow-kitchen-blue-glow font-black'
                    : 'bg-kitchen-elevated text-kitchen-text-secondary border border-kitchen-border/70 hover:text-kitchen-text-primary hover:border-kitchen-amber'
                }`}
              >
                <span>{lang.nativeLabel}</span>
                {langCode !== 'en' && <span className="opacity-75 font-normal">({lang.label})</span>}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Hero Badge */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-kitchen-amber/40 bg-kitchen-amber/10 text-kitchen-amber text-xs sm:text-sm font-bold uppercase tracking-wider shadow-kitchen-blue-glow"
      >
        <Sparkles className="w-4 h-4 text-kitchen-amber" />
        <span>{t.heroBadge}</span>
      </motion.div>

      {/* Hero Title & Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4 max-w-2xl"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-kitchen-text-primary leading-[1.15]">
          {t.heroTitlePrefix} <span className="text-kitchen-amber">{t.heroTitleAccent}</span> {t.heroTitleSuffix}
        </h1>
        <p className="text-base sm:text-lg text-kitchen-text-secondary leading-relaxed">
          {t.heroSubtitle}
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
              placeholder={t.pastePlaceholder}
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
                <span>{t.analyzingRecipe}</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>{t.loadRecipe}</span>
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
          {t.orQuickTest}
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
          <h3 className="text-base font-bold text-kitchen-text-primary mb-1">{t.howItWorks01Title}</h3>
          <p className="text-xs text-kitchen-text-muted leading-relaxed">
            {t.howItWorks01Desc}
          </p>
        </div>

        <div className="p-4 bg-kitchen-surface border border-kitchen-border rounded-2xl">
          <div className="text-xl font-mono font-bold text-kitchen-cyan mb-1">02</div>
          <h3 className="text-base font-bold text-kitchen-text-primary mb-1">{t.howItWorks02Title}</h3>
          <p className="text-xs text-kitchen-text-muted leading-relaxed">
            {t.howItWorks02Desc}
          </p>
        </div>

        <div className="p-4 bg-kitchen-surface border border-kitchen-border rounded-2xl">
          <div className="text-xl font-mono font-bold text-kitchen-terracotta mb-1">03</div>
          <h3 className="text-base font-bold text-kitchen-text-primary mb-1">{t.howItWorks03Title}</h3>
          <p className="text-xs text-kitchen-text-muted leading-relaxed">
            {t.howItWorks03Desc}
          </p>
        </div>

        <div className="p-4 bg-kitchen-surface border border-kitchen-border rounded-2xl">
          <div className="text-xl font-mono font-bold text-kitchen-emerald mb-1">04</div>
          <h3 className="text-base font-bold text-kitchen-text-primary mb-1">{t.howItWorks04Title}</h3>
          <p className="text-xs text-kitchen-text-muted leading-relaxed">
            {t.howItWorks04Desc}
          </p>
        </div>
      </div>
    </div>
  );
};
