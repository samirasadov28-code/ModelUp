"use client";

import { cn, formatCurrencyCompact } from "@/lib/utils";
import type { UnitEconomics } from "@/lib/types";

const fmt = formatCurrencyCompact;

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  status?: "green" | "amber" | "red" | "neutral";
  blurred?: boolean;
}

function MetricCard({ label, value, sub, status = "neutral", blurred = false }: MetricCardProps) {
  const statusStyles = {
    green: "border-emerald-200 bg-emerald-50/60",
    amber: "border-amber-200 bg-amber-50/60",
    red: "border-red-200 bg-red-50/60",
    neutral: "border-gray-200 bg-white",
  };

  const textStyles = {
    green: "text-emerald-700",
    amber: "text-amber-700",
    red: "text-red-700",
    neutral: "text-gray-900",
  };

  const dotStyles = {
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    neutral: "bg-transparent",
  };

  return (
    <div className={cn("rounded-xl border p-5 relative overflow-hidden shadow-sm", statusStyles[status])}>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">{label}</p>
      <p
        className={cn(
          "text-2xl font-bold font-mono tabular-nums",
          textStyles[status],
          blurred && "blur-sm select-none"
        )}
      >
        {value}
      </p>
      {sub && (
        <p className={cn("text-xs text-gray-500 mt-1", blurred && "blur-sm")}>{sub}</p>
      )}
      {status !== "neutral" && (
        <div className={cn("absolute top-4 right-4 w-2 h-2 rounded-full", dotStyles[status])} />
      )}
      {blurred && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-blue-700 font-semibold bg-white/95 px-3 py-1.5 rounded-full border border-blue-200 shadow-sm">
            Pro only
          </span>
        </div>
      )}
    </div>
  );
}

interface UnitEconomicsDashboardProps {
  ue: UnitEconomics;
  blurValues?: boolean;
}

export function UnitEconomicsDashboard({ ue, blurValues = false }: UnitEconomicsDashboardProps) {
  const ltvLabel =
    ue.ltvCacRatio >= 3 ? "Healthy — investors will like this" :
    ue.ltvCacRatio >= 1 ? "Acceptable — room to improve" :
    "Needs work — LTV is below CAC";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Customer Acquisition Cost"
          value={fmt(ue.cac)}
          sub="All-in cost per new customer"
          blurred={blurValues}
        />
        <MetricCard
          label="Lifetime Value"
          value={fmt(ue.ltv)}
          sub={`Based on ${(ue.grossMarginRate * 100).toFixed(0)}% gross margin`}
          blurred={blurValues}
        />
        <MetricCard
          label="LTV / CAC Ratio"
          value={`${ue.ltvCacRatio.toFixed(1)}x`}
          sub={blurValues ? undefined : ltvLabel}
          status={blurValues ? "neutral" : ue.cacStatus}
          blurred={blurValues}
        />
        <MetricCard
          label="Payback Period"
          value={`${Math.round(ue.paybackMonths)} months`}
          sub="Time to recover CAC from margin"
          blurred={blurValues}
        />
      </div>

      {!blurValues && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Blended ARPU</p>
          <p className="text-xl font-bold text-gray-900 font-mono">{fmt(ue.blendedArpu)}<span className="text-sm text-gray-400 font-normal ml-1">/month</span></p>
          <p className="text-xs text-gray-500 mt-1">Weighted average across all pricing tiers</p>
        </div>
      )}
    </div>
  );
}
