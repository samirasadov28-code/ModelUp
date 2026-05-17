"use client";

import { TrendingUp, BarChart3 } from "lucide-react";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils";
import type { ModelOutputs } from "@/lib/types";
import { useT } from "@/i18n/LocaleProvider";

interface ValuationCardProps {
  model: ModelOutputs;
}

export function ValuationCard({ model }: ValuationCardProps) {
  const { t } = useT();
  const currency = model.currency;
  const fmt = (v: number) => formatCurrencyCompact(v, currency);
  const fmtFull = (v: number) => formatCurrency(v, 0, currency);
  const v = model.valuation;
  const mv = v.multipleValuation;

  const dcfEv = Math.max(0, v.enterpriseValue);
  const basisLabel = mv.basis === "ebitda" ? t("val.basis_ebitda") : t("val.basis_revenue");

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-gray-900 font-semibold text-base">{t("val.title")}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("val.subtitle")}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* DCF */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              {t("val.dcf_intrinsic")}
            </p>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 font-mono tabular-nums">
            {fmt(dcfEv)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{t("val.enterprise_value")}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                {t("val.discount_rate")}
              </p>
              <p className="font-mono text-gray-900 tabular-nums">
                {(v.discountRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                {t("val.terminal_growth")}
              </p>
              <p className="font-mono text-gray-900 tabular-nums">
                {(v.terminalGrowthRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                {t("val.pv_of_fcf")}
              </p>
              <p className="font-mono text-gray-900 tabular-nums">{fmtFull(v.pvOfFcf)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                {t("val.pv_of_terminal")}
              </p>
              <p className="font-mono text-gray-900 tabular-nums">{fmtFull(v.pvOfTerminal)}</p>
            </div>
          </div>
        </div>

        {/* EBITDA / Revenue multiple */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              {mv.basis === "ebitda" ? t("val.ebitda_mult_comps") : t("val.revenue_mult_comps")}
            </p>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 font-mono tabular-nums">
            {fmt(Math.max(0, mv.baseValuation))}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {t("val.times_mult_basis", { label: mv.baseLabel, mult: String(mv.baseMultiple), basis: basisLabel })}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                {t("val.mult_low", { mult: String(mv.lowMultiple) })}
              </p>
              <p className="font-mono text-gray-900 tabular-nums">
                {fmt(Math.max(0, mv.lowValuation))}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
                {t("val.mult_base", { mult: String(mv.baseMultiple) })}
              </p>
              <p className="font-mono text-emerald-700 font-semibold tabular-nums">
                {fmt(Math.max(0, mv.baseValuation))}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                {t("val.mult_high", { mult: String(mv.highMultiple) })}
              </p>
              <p className="font-mono text-gray-900 tabular-nums">
                {fmt(Math.max(0, mv.highValuation))}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-3 leading-snug">{mv.note}</p>
        </div>
      </div>
    </div>
  );
}
