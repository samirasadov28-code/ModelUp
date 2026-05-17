"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { useT } from "@/i18n/LocaleProvider";

interface ProUpsellProps {
  headline: string;
  body?: string;
  href?: string;
  ctaLabel?: string;
}

export function ProUpsell({
  headline,
  body,
  href = "/pricing",
  ctaLabel,
}: ProUpsellProps) {
  const { t } = useT();
  const cta = ctaLabel ?? t("ups.see_features");
  return (
    <div className="mt-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-200 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 leading-snug">
            <span className="text-blue-700">{t("ups.pro_prefix")}</span> {headline}
          </p>
          {body && <p className="text-xs text-gray-600 mt-0.5 leading-snug">{body}</p>}
        </div>
        <Link
          href={href}
          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
        >
          {cta}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
