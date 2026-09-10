import React from 'react';
import { motion } from 'framer-motion';
import { useSousVoiceStore } from '../store/useSousVoiceStore';
import { Clock, Mic, Minus, Play, Plus, Users, Utensils, Zap } from 'lucide-react';
import { getTranslation } from '../services/localization';

interface PreConnectScreenProps {
  onStart: () => void;
}

export const PreConnectScreen: React.FC<PreConnectScreenProps> = ({ onStart }) => {
  const { recipe, setScreen, servings, setServings, language } = useSousVoiceStore();
  const t = getTranslation(language);

  const handleServingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setServings(0);
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setServings(parsed);
    }
  };

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
          <span>{t.recipeReady}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-kitchen-text-primary mb-2 leading-tight">
          {recipe.name}
        </h1>

        <div className="flex items-center justify-center gap-3 text-kitchen-text-secondary text-sm sm:text-base font-semibold mb-6 flex-wrap">
          {/* Unlimited Serving Control directly on PreConnect screen */}
          <div className="flex items-center gap-1.5 bg-kitchen-elevated border border-kitchen-border rounded-xl px-2 py-1">
            <Users className="w-4 h-4 text-kitchen-amber" />
            <button
              type="button"
              onClick={() => servings > 0 && setServings(servings - 1)}
              aria-label="Decrease servings"
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-kitchen-active text-kitchen-text-muted hover:text-kitchen-text-primary text-xs font-bold"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              min="0"
              value={servings}
              onChange={handleServingChange}
              aria-label="Recipe servings"
              className="w-10 text-center bg-transparent font-extrabold text-kitchen-text-primary text-sm outline-none focus:text-kitchen-amber [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => setServings(servings + 1)}
              aria-label="Increase servings"
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-kitchen-active text-kitchen-text-muted hover:text-kitchen-text-primary text-xs font-bold"
            >
              <Plus className="w-3 h-3" />
            </button>
            <span className="text-xs text-kitchen-text-muted font-medium">{t.servings}</span>
          </div>

          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-kitchen-cyan" />
            {recipe.totalTime || recipe.cookTime || '30 min'} {t.cookTime}
          </span>
          <span>•</span>
          <span>{recipe.steps.length} {t.steps}</span>
        </div>

        {/* What You Can Say */}
        <div className="bg-kitchen-elevated border border-kitchen-border rounded-2xl p-4 text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-kitchen-text-muted block mb-2.5">
            {t.whatYouCanAsk}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-kitchen-text-secondary font-medium">
            <div className="flex items-start gap-2">
              <span className="text-kitchen-amber">💬</span>
              <span>
                {language === 'hi'
                  ? '“क्या मैं पनीर या कोई और चीज़ बदल सकता हूँ?”'
                  : language === 'te'
                  ? '“నేను పనీర్ లేదా వేరేది వాడవచ్చా?”'
                  : '“Can I replace chicken with paneer?”'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-kitchen-amber">⚖️</span>
              <span>
                {language === 'hi'
                  ? '“कितना नमक या मसाला डालना है?”'
                  : language === 'te'
                  ? '“ఎంత ఉప్పు లేదా కారం వేయాలి?”'
                  : '“How much salt or spice?”'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-kitchen-cyan">⚡</span>
              <span>
                {language === 'hi'
                  ? '“इंडक्शन स्टोव पर आंच कितनी रखें?”'
                  : language === 'te'
                  ? '“ఇండక్షన్ పొయ్యిపై ఎంత మంట పెట్టాలి?”'
                  : '“What if I use an induction stove?”'}
              </span>
            </div>
            <div className="flex items-start gap-2 text-kitchen-crimson font-bold">
              <Zap className="w-4 h-4 fill-current shrink-0 mt-0.5" />
              <span>{t.interruptNotice}</span>
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
          <span>{t.startCooking}</span>
        </motion.button>

        <button
          type="button"
          onClick={() => setScreen('home')}
          className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-kitchen-border bg-kitchen-surface text-kitchen-text-muted hover:text-kitchen-text-primary transition-all"
        >
          {t.changeDish}
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-kitchen-text-muted max-w-md">
        <Mic className="w-4 h-4 text-kitchen-emerald shrink-0" />
        <span>{t.handsFreeNotice}</span>
      </div>
    </div>
  );
};
