"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

interface ProUpsellProps {
  /** Single-line, sentence-cased headline pitching the relevant feature. */
  headline: string;
  /** Optional supporting copy under the headline. Keep it tight. */
  body?: string;
  /** Optional override for the CTA destination — defaults to /pricing. */
  href?: string;
  ctaLabel?: string;
}

/**
 * Compact, contextual Pro-upsell callout used under each questionnaire step.
 * Styled subtle on purpose — informative, not interruptive — so it doesn't
 * steal focus from the question being answered.
 */
export function ProUpsell({
  headline,
  body,
  href = "/pricing",
  ctaLabel = "See Pro features",
}: ProUpsellProps) {
  return (
    <div className="mt-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-200 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 leading-snug">
            <span className="text-blue-700">Pro:</span> {headline}
          </p>
          {body && <p className="text-xs text-gray-600 mt-0.5 leading-snug">{body}</p>}
        </div>
        <Link
          href={href}
          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
        >
          {ctaLabel}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
