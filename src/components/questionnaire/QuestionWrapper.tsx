"use client";

import { cn } from "@/lib/utils";

interface QuestionWrapperProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  isLast?: boolean;
}

export function QuestionWrapper({
  stepNumber,
  totalSteps,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextDisabled,
  nextLabel = "Continue",
  isLast = false,
}: QuestionWrapperProps) {
  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Step counter */}
      <p className="text-xs font-medium text-white/30 uppercase tracking-widest mb-2">
        Step {stepNumber} of {totalSteps}
      </p>

      {/* Question */}
      <h2 className="text-2xl font-semibold text-white mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-white/50 mb-6">{subtitle}</p>}
      {!subtitle && <div className="mb-6" />}

      {/* Content */}
      <div className="space-y-3">{children}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-white/40 hover:text-white transition-colors"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
            nextDisabled
              ? "bg-white/10 text-white/30 cursor-not-allowed"
              : "bg-accent-500 text-white hover:bg-accent-600 shadow-lg shadow-accent-500/20"
          )}
        >
          {isLast ? "Generate My Model →" : `${nextLabel} →`}
        </button>
      </div>
    </div>
  );
}
