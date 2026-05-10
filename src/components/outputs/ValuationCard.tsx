"use client";

import { TrendingUp, BarChart3 } from "lucide-react";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils";
import type { ModelOutputs } from "@/lib/types";

interface ValuationCardProps {
  model: ModelOutputs;
}

/**
 * Two-card valuation summary: DCF and an EBITDA / revenue-multiple comp.
 * Rendered on both the free preview (read-only snapshot) and the Pro Full
 * page (sits above the editable Pro WACC panel).
 */
export function ValuationCard({ model }: ValuationCardProps) {
  const currency = model.currency;
  const fmt = (v: number) => formatCurrencyCompact(v, currency);
  const fmtFull = (v: number) => formatCurrency(v, 0, currency);
  const v = model.valuation;
  const mv = v.multipleValuation;

  const dcfEv = Math.max(0, v.enterpriseValue);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-gray-900 font-semibold text-base">Valuation</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            DCF and comps-based EBITDA multiple — two independent anchors so you can triangulate.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* DCF */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              DCF (intrinsic)
            </p>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 font-mono tabular-nums">
            {fmt(dcfEv)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Enterprise value</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Discount rate
              </p>
              <p className="font-mono text-gray-900 tabular-nums">
                {(v.discountRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Terminal growth
              </p>
              <p className="font-mono text-gray-900 tabular-nums">
                {(v.terminalGrowthRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                PV of FCF
              </p>
              <p className="font-mono text-gray-900 tabular-nums">{fmtFull(v.pvOfFcf)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                PV of terminal
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
              {mv.basis === "ebitda" ? "EBITDA multiple (comps)" : "Revenue multiple (comps)"}
            </p>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 font-mono tabular-nums">
            {fmt(Math.max(0, mv.baseValuation))}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {mv.baseLabel} × {mv.baseMultiple}× ({mv.basis === "ebitda" ? "EBITDA mult." : "ARR mult."})
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Low ({mv.lowMultiple}×)
              </p>
              <p className="font-mono text-gray-900 tabular-nums">
                {fmt(Math.max(0, mv.lowValuation))}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
                Base ({mv.baseMultiple}×)
              </p>
              <p className="font-mono text-emerald-700 font-semibold tabular-nums">
                {fmt(Math.max(0, mv.baseValuation))}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                High ({mv.highMultiple}×)
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
