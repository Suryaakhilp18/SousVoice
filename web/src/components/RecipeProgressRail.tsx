import React from 'react';
import { motion } from 'framer-motion';
import { useSousVoiceStore } from '../store/useSousVoiceStore';
import { Check, ChevronRight, Sparkles } from 'lucide-react';

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
  const { recipe } = useSousVoiceStore();
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
            <span>Step {currentStep} of {total}</span>
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
              aria-label={`Step ${stepNum}`}
              onClick={() => onSelectStep(stepNum)}
              className={`relative flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-kitchen-amber active:scale-95 ${
                isCurrent
                  ? 'bg-kitchen-amber text-slate-950 border-kitchen-amber shadow-sm scale-105 font-extrabold ring-2 ring-kitchen-amber/40'
                  : isDone
                  ? 'bg-kitchen-emerald/20 text-kitchen-emerald border-kitchen-emerald/60 hover:bg-kitchen-emerald/30'
                  : 'bg-kitchen-elevated text-kitchen-text-muted border-kitchen-border hover:border-kitchen-border-strong hover:text-kitchen-text-secondary'
              }`}
            >
              {isDone && !isCurrent ? <Check className="w-3 h-3 stroke-[2.5]" /> : stepNum}
            </button>
          );
        })}
      </div>

      {/* Active Step Instruction Card */}
      <div className="bg-kitchen-elevated border border-kitchen-border rounded-xl p-2.5 sm:p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-kitchen-text-muted uppercase tracking-wider">
          <span>Active Instruction</span>
          <span className="text-kitchen-amber">Step {currentStep}</span>
        </div>

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-xs sm:text-sm font-semibold leading-relaxed text-kitchen-text-primary"
        >
          {currentStepText}
        </motion.div>

        {currentStep < total && (
          <button
            type="button"
            onClick={() => onSelectStep(currentStep + 1)}
            className="self-end inline-flex items-center gap-1 text-[11px] font-bold text-kitchen-amber hover:text-sky-300 transition-colors mt-0.5"
          >
            <span>Next: Step {currentStep + 1}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

