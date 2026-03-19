'use client';

import type { Step } from '@/types/pipeline';

const STEPS: { key: Step; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'research', label: 'Research' },
  { key: 'analysis', label: 'Angles' },
  { key: 'questions', label: 'Questions' },
  { key: 'blueprint', label: 'Blueprint' },
  { key: 'generate', label: 'Generate' },
];

const STEP_INDEX: Record<Step, number> = {
  upload: 0, research: 1, analysis: 2, questions: 3, blueprint: 4, generate: 5,
};

export function StepIndicator({
  currentStep,
  onGoToStep,
}: {
  currentStep: Step;
  onGoToStep: (step: Step) => void;
}) {
  const currentIdx = STEP_INDEX[currentStep];

  return (
    <div className="flex items-center gap-1 sm:gap-2 mb-8">
      {STEPS.map((step, i) => {
        const isComplete = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isClickable = isComplete;

        return (
          <div key={step.key} className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => isClickable && onGoToStep(step.key)}
              disabled={!isClickable}
              className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                isCurrent
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : isComplete
                  ? 'bg-surface-raised text-text-primary border border-border cursor-pointer hover:border-accent/40'
                  : 'bg-surface-raised/50 text-text-muted border border-border/50'
              }`}
            >
              <span
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                  isCurrent
                    ? 'bg-accent text-white'
                    : isComplete
                    ? 'bg-success/20 text-success'
                    : 'bg-border text-text-muted'
                }`}
              >
                {isComplete ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`w-4 sm:w-8 h-px ${
                  i < currentIdx ? 'bg-success/40' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
