import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Clock,
  ListOrdered,
  RefreshCw,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { useSousVoiceStore } from '../store/useSousVoiceStore';

interface RecipeContextPanelProps {
  onSelectStep?: (step: number) => void;
}

export const RecipeContextPanel: React.FC<RecipeContextPanelProps> = ({ onSelectStep }) => {
  const { recipe, currentStep, completedSteps, setCurrentStep, setScreen } = useSousVoiceStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStepClick = (stepNum: number) => {
    if (onSelectStep) {
      onSelectStep(stepNum);
    } else {
      setCurrentStep(stepNum);
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
          <span>Switch</span>
        </button>
      </div>

      {/* Row 2: Recipe Metrics & Accordion Toggle */}
      <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-kitchen-border/70 text-xs text-kitchen-text-secondary">
        <div className="flex items-center gap-2 text-[11px] text-kitchen-text-muted">
          <span className="flex items-center gap-1 text-kitchen-text-secondary">
            <Users className="w-3.5 h-3.5 text-kitchen-amber" />
            {recipe.servings} Servings
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-kitchen-text-secondary">
            <Clock className="w-3.5 h-3.5 text-kitchen-cyan" />
            {recipe.totalTime || recipe.cookTime || '30 min'}
          </span>
          <span>•</span>
          <span>{recipe.ingredients.length} ingr.</span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse recipe details' : 'Expand recipe details'}
          className="text-[11px] font-bold text-kitchen-amber hover:text-sky-300 flex items-center gap-1 transition-colors"
        >
          {isExpanded ? (
            <>
              <span>Hide Details</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>All Steps ({recipe.steps.length})</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Expandable Accordion: Ingredients & All Steps */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-kitchen-border mt-3 pt-3 space-y-3.5"
          >
            {/* Ingredients Grid */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-kitchen-amber mb-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Ingredients ({recipe.ingredients.length})</span>
              </div>
              <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto pr-1">
                {recipe.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="px-2.5 py-1 bg-kitchen-elevated border border-kitchen-border/60 rounded-md text-[11px] text-kitchen-text-secondary flex items-start gap-1.5"
                  >
                    <span className="text-kitchen-amber font-bold">•</span>
                    <span>{ing}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* All Steps Carousel with Interactive Jumping */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-kitchen-cyan mb-1.5">
                <div className="flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Click Any Step to Jump:</span>
                </div>
                <span className="text-kitchen-amber font-bold">Active: Step {currentStep}</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {recipe.steps.map((step, idx) => {
                  const stepNum = idx + 1;
                  const isActive = stepNum === currentStep;
                  const isDone = completedSteps.includes(stepNum) || stepNum < currentStep;

                  return (
                    <button
                      key={stepNum}
                      type="button"
                      onClick={() => handleStepClick(stepNum)}
                      aria-label={`Jump to Step ${stepNum}`}
                      className={`w-full text-left p-2 rounded-xl border text-xs leading-relaxed transition-all flex items-start gap-2 active:scale-[0.99] ${
                        isActive
                          ? 'bg-kitchen-amber/15 border-kitchen-amber text-kitchen-text-primary shadow-sm font-medium'
                          : isDone
                          ? 'bg-kitchen-emerald/10 border-kitchen-emerald/40 text-kitchen-text-secondary hover:border-kitchen-emerald'
                          : 'bg-kitchen-elevated border-kitchen-border/60 text-kitchen-text-muted hover:border-kitchen-border-strong hover:text-kitchen-text-secondary'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                          isActive
                            ? 'bg-kitchen-amber text-slate-950 shadow-sm'
                            : isDone
                            ? 'bg-kitchen-emerald text-white'
                            : 'bg-kitchen-surface text-kitchen-text-muted border border-kitchen-border'
                        }`}
                      >
                        {isDone && !isActive ? <Check className="w-3 h-3 stroke-[2.5]" /> : stepNum}
                      </span>
                      <span className="flex-1">{step}</span>
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
