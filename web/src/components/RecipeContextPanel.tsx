import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Clock,
  ListOrdered,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { useSousVoiceStore } from '../store/useSousVoiceStore';
import { getTranslation } from '../services/localization';

interface RecipeContextPanelProps {
  onSelectStep?: (step: number) => void;
}

export const RecipeContextPanel: React.FC<RecipeContextPanelProps> = ({ onSelectStep }) => {
  const { recipe, currentStep, completedSteps, setCurrentStep, setScreen, servings, setServings, language } = useSousVoiceStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const t = getTranslation(language);

  const handleStepClick = (stepNum: number) => {
    if (onSelectStep) {
      onSelectStep(stepNum);
    } else {
      setCurrentStep(stepNum);
    }
  };

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

  const handleIncrement = () => {
    setServings(servings + 1);
  };

  const handleDecrement = () => {
    if (servings > 0) {
      setServings(servings - 1);
    }
  };

  return (
    <div className="w-full bg-kitchen-surface border border-kitchen-border rounded-2xl p-3.5 sm:p-4 shadow-kitchen-sm transition-all">
      {/* Row 1: Dish Identity & Switch Button */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-kitchen-amber/15 border border-kitchen-amber/30 flex items-center justify-center text-kitchen-amber shrink-0 shadow-sm mt-0.5">
            <ChefHat className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              className="text-sm sm:text-base font-extrabold text-kitchen-text-primary leading-tight truncate"
              title={recipe.name}
            >
              {recipe.name}
            </h2>
            {recipe.cuisine && (
              <div className="mt-1">
                <span
                  className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-kitchen-elevated border border-kitchen-border text-kitchen-text-muted truncate max-w-full"
                  title={recipe.cuisine}
                >
                  {recipe.cuisine}
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setScreen('home')}
          className="shrink-0 px-2.5 py-1.5 rounded-lg border border-kitchen-border hover:border-kitchen-amber text-[11px] font-semibold text-kitchen-text-muted hover:text-kitchen-text-primary flex items-center gap-1.5 transition-all active:scale-95"
          title="Change Dish or load another URL"
        >
          <RefreshCw className="w-3 h-3 text-kitchen-amber" />
          <span>{t.switchDish}</span>
        </button>
      </div>

      {/* Row 2: Interactive Unlimited Servings Control + Derived Timing + Ingredients count */}
      <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-kitchen-border/70 text-xs text-kitchen-text-secondary flex-wrap">
        <div className="flex items-center gap-2 text-[11px]">
          {/* Dynamic Unlimited Serving Input with +/- */}
          <div className="flex items-center gap-1 bg-kitchen-elevated border border-kitchen-border/80 rounded-lg px-1.5 py-0.5" title="Scale recipe servings (any number >= 0)">
            <Users className="w-3 h-3 text-kitchen-amber shrink-0" />
            <button
              type="button"
              onClick={handleDecrement}
              aria-label="Decrease servings"
              className="w-4 h-4 rounded flex items-center justify-center hover:bg-kitchen-active text-kitchen-text-muted hover:text-kitchen-text-primary text-[10px] font-bold transition-colors"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <input
              type="number"
              min="0"
              value={servings}
              onChange={handleServingChange}
              aria-label="Recipe servings"
              className="w-8 text-center bg-transparent font-extrabold text-kitchen-text-primary text-[11px] outline-none focus:text-kitchen-amber [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={handleIncrement}
              aria-label="Increase servings"
              className="w-4 h-4 rounded flex items-center justify-center hover:bg-kitchen-active text-kitchen-text-muted hover:text-kitchen-text-primary text-[10px] font-bold transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
            <span className="text-kitchen-text-muted font-medium text-[10px] pr-0.5">{t.servings}</span>
          </div>

          <span className="text-kitchen-border">•</span>

          {/* Derived cooking duration */}
          <span className="flex items-center gap-1 text-kitchen-text-secondary" title="Estimated cooking time">
            <Clock className="w-3 h-3 text-kitchen-cyan shrink-0" />
            <span>{recipe.totalTime || recipe.cookTime || '30 min'}</span>
          </span>

          <span className="text-kitchen-border">•</span>
          <span className="text-kitchen-text-muted">{recipe.ingredients.length} ingr.</span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse recipe details' : 'Expand recipe details'}
          className="text-[11px] font-bold text-kitchen-amber hover:text-sky-300 flex items-center gap-1 transition-colors ml-auto"
        >
          {isExpanded ? (
            <>
              <span>{t.hideDetails}</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>{t.allSteps} ({recipe.steps.length})</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Expandable Accordion: Scaled Ingredients & All Steps */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-kitchen-border mt-3 pt-3 space-y-3.5"
          >
            {/* Ingredients Grid - dynamically scaled */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-kitchen-amber mb-1.5">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{t.ingredients} ({recipe.ingredients.length})</span>
                </div>
                {servings !== 4 && (
                  <span className="text-[10px] text-kitchen-text-muted lowercase font-normal">
                    (scaled for {servings})
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
                {recipe.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="px-2.5 py-1 bg-kitchen-elevated border border-kitchen-border/60 rounded-md text-[11px] text-kitchen-text-secondary flex items-start gap-1.5"
                  >
                    <span className="text-kitchen-amber font-bold">•</span>
                    <span className="font-medium text-kitchen-text-primary">{ing}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* All Steps Carousel with Interactive Jumping */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-kitchen-cyan mb-1.5">
                <div className="flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>{t.allSteps} ({recipe.steps.length})</span>
                </div>
                <span className="text-[10px] text-kitchen-text-muted">Click step to jump</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {recipe.steps.map((step, idx) => {
                  const stepNum = idx + 1;
                  const isActive = stepNum === currentStep;
                  const isDone = completedSteps.includes(stepNum);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleStepClick(stepNum)}
                      aria-current={isActive ? 'step' : undefined}
                      className={`w-full text-left p-2 rounded-xl border text-xs transition-all flex items-start gap-2 ${
                        isActive
                          ? 'bg-kitchen-amber/15 border-kitchen-amber text-kitchen-text-primary shadow-sm font-semibold'
                          : isDone
                          ? 'bg-kitchen-surface border-kitchen-border/60 text-kitchen-text-muted hover:border-kitchen-border'
                          : 'bg-kitchen-elevated border-kitchen-border/80 text-kitchen-text-secondary hover:border-kitchen-border'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                          isActive
                            ? 'bg-kitchen-amber text-slate-950 shadow-sm'
                            : isDone
                            ? 'bg-kitchen-emerald/20 text-kitchen-emerald border border-kitchen-emerald/40'
                            : 'bg-kitchen-border text-kitchen-text-muted'
                        }`}
                      >
                        {isDone ? <Check className="w-3 h-3" /> : stepNum}
                      </div>

                      <div className="flex-1 leading-relaxed">
                        <span className="block">{step}</span>
                        {isActive && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-kitchen-amber uppercase tracking-wider">
                            ● Active Step
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
