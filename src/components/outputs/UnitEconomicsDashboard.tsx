"use client";

import { cn } from "@/lib/utils";
import type { UnitEconomics } from "@/lib/types";

function fmt(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  status?: "green" | "amber" | "red" | "neutral";
  blurred?: boolean;
}

function MetricCard({ label, value, sub, status = "neutral", blurred = false }: MetricCardProps) {
  const statusColors = {
    green: "border-emerald-500/30 bg-emerald-500/5",
    amber: "border-amber-500/30 bg-amber-500/5",
    red: "border-red-500/30 bg-red-500/5",
    neutral: "border-white/10 bg-white/3",
  };

  const textColors = {
    green: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
    neutral: "text-white",
  };

  const dotColors = {
    green: "bg-emerald-400",
    amber: "bg-amber-400",
    red: "bg-red-400",
    neutral: "bg-transparent",
  };

  return (
    <div className={cn("rounded-xl border p-5 relative overflow-hidden", statusColors[status])}>
      <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-medium">{label}</p>
      <p
        className={cn(
          "text-2xl font-bold font-mono tabular-nums",
          textColors[status],
          blurred && "blur-sm select-none"
        )}
      >
        {value}
      </p>
      {sub && (
        <p className={cn("text-xs text-white/40 mt-1", blurred && "blur-sm")}>{sub}</p>
      )}
      {status !== "neutral" && (
        <div className={cn("absolute top-4 right-4 w-2 h-2 rounded-full", dotColors[status])} />
      )}
      {blurred && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-white/50 bg-navy-900/80 px-2 py-1 rounded-md border border-white/10">
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
        <div className="rounded-xl border border-white/10 bg-white/3 p-4">
          <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-2">Blended ARPU</p>
          <p className="text-xl font-bold text-white font-mono">{fmt(ue.blendedArpu)}<span className="text-sm text-white/40 font-normal ml-1">/month</span></p>
          <p className="text-xs text-white/30 mt-1">Weighted average across all pricing tiers</p>
        </div>
      )}
    </div>
  );
}
