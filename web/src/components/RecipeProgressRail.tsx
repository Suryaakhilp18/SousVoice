import React from 'react';
import { motion } from 'framer-motion';
import { useSousVoiceStore } from '../store/useSousVoiceStore';
import { Check, ChevronRight, Sparkles } from 'lucide-react';
import { getTranslation } from '../services/localization';

interface RecipeProgressRailProps {
  currentStep: number;
  completedSteps: number[];
  onSelectStep: (step: number) => void;
}

export const RecipeProgressRail: React.FC<RecipeProgressRailProps> = ({
  currentStep,
  completedSteps,
  onSelectStep,
}) => {
  const { recipe, language } = useSousVoiceStore();
  const t = getTranslation(language);
  const total = recipe.steps.length;
  const currentStepText = recipe.steps[currentStep - 1] || recipe.steps[0];
  const percent = Math.round((currentStep / total) * 100);

  return (
    <div className="bg-kitchen-surface border border-kitchen-border rounded-2xl p-3 sm:p-3.5 shadow-kitchen-sm flex flex-col gap-2.5">
      {/* Header: Progress Counter & Percentage Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="uppercase tracking-wider text-kitchen-amber flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>{t.stepProgress} {currentStep} {t.of} {total}</span>
          </span>
          <span className="text-kitchen-text-muted font-mono">{percent}%</span>
        </div>

        <div className="w-full h-1.5 bg-kitchen-elevated rounded-full overflow-hidden border border-kitchen-border/50">
          <motion.div
            className="h-full bg-gradient-to-r from-kitchen-amber to-sky-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Carousel Nodes */}
      <div
        className="flex items-center gap-1.5 flex-wrap py-0.5"
        role="tablist"
        aria-label="Recipe steps progress"
      >
        {recipe.steps.map((_, idx) => {
          const stepNum = idx + 1;
          const isCurrent = stepNum === currentStep;
          const isDone = completedSteps.includes(stepNum) || stepNum < currentStep;

          return (
            <button
              key={stepNum}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              aria-label={`Jump to step ${stepNum}`}
              onClick={() => onSelectStep(stepNum)}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all active:scale-95 ${
                isCurrent
                  ? 'bg-kitchen-amber text-slate-950 shadow-kitchen-blue-glow ring-2 ring-kitchen-amber/40 scale-105'
                  : isDone
                  ? 'bg-kitchen-emerald/20 text-kitchen-emerald border border-kitchen-emerald/40 hover:bg-kitchen-emerald/30'
                  : 'bg-kitchen-elevated text-kitchen-text-muted border border-kitchen-border hover:border-kitchen-border-strong hover:text-kitchen-text-primary'
              }`}
            >
              {isDone && !isCurrent ? <Check className="w-3.5 h-3.5" /> : stepNum}
            </button>
          );
        })}
      </div>

      {/* Active Step Instruction Card */}
      <div className="bg-kitchen-elevated border border-kitchen-border/80 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="uppercase tracking-wider text-kitchen-amber">
            {t.activeInstruction}
          </span>
          <span className="text-kitchen-text-muted font-mono">{t.step} {currentStep}</span>
        </div>

        <p className="text-xs text-kitchen-text-primary leading-relaxed line-clamp-3">
          {currentStepText}
        </p>

        {currentStep < total && (
          <button
            type="button"
            onClick={() => onSelectStep(currentStep + 1)}
            className="self-end inline-flex items-center gap-1 text-[11px] font-bold text-kitchen-amber hover:text-sky-300 transition-colors pt-0.5"
          >
            <span>{t.next}: {t.step} {currentStep + 1}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
