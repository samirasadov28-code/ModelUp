"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LocaleProvider";

interface QuestionWrapperProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  /** Override the Next label. Falls back to localized "Continue →". */
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
  nextLabel,
  isLast = false,
}: QuestionWrapperProps) {
  const { t } = useT();
  const next = isLast
    ? t("common.generate_model")
    : `${nextLabel ?? t("common.continue")} →`;
  return (
    <div className="w-full max-w-xl mx-auto">
      <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">
        {t("common.step_of", { current: stepNumber, total: totalSteps })}
      </p>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mb-6">{subtitle}</p>}
      {!subtitle && <div className="mb-6" />}

      <div className="space-y-3">{children}</div>

      <div className="flex items-center justify-between mt-8">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← {t("common.back")}
          </button>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-semibold transition-all",
            nextDisabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
          )}
        >
          {next}
        </button>
      </div>
    </div>
  );
}
