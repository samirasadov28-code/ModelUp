"use client";

import { cn, formatCurrencyCompact, formatNumber } from "@/lib/utils";
import type { ScenarioMetrics } from "@/lib/types";

const fmt = formatCurrencyCompact;

interface ScenarioComparisonProps {
  base: ScenarioMetrics;
  conservative: ScenarioMetrics;
  aggressive: ScenarioMetrics;
}

const COLS = [
  { key: "revenueY1" as keyof ScenarioMetrics, label: "Revenue Y1", format: fmt },
  { key: "revenueY2" as keyof ScenarioMetrics, label: "Revenue Y2", format: fmt },
  { key: "revenueY3" as keyof ScenarioMetrics, label: "Revenue Y3", format: fmt },
  { key: "arrY3" as keyof ScenarioMetrics, label: "ARR (EoY3)", format: fmt },
  { key: "ebitdaY3" as keyof ScenarioMetrics, label: "EBITDA Y3", format: fmt },
  { key: "totalUsersY3" as keyof ScenarioMetrics, label: "Customers Y3", format: (v: number) => formatNumber(v) },
  { key: "runwayMonths" as keyof ScenarioMetrics, label: "Runway", format: (v: number) => v >= 36 ? "36mo+" : `${v}mo` },
];

const SCENARIO_STYLES = {
  Conservative: "border-slate-500/30 bg-slate-500/5",
  Base: "border-accent-500/30 bg-accent-500/5",
  Aggressive: "border-violet-500/30 bg-violet-500/5",
};

const HEADER_STYLES = {
  Conservative: "text-slate-300",
  Base: "text-accent-400",
  Aggressive: "text-violet-400",
};

export function ScenarioComparison({ base, conservative, aggressive }: ScenarioComparisonProps) {
  const scenarios = [
    { data: conservative, name: "Conservative" as const },
    { data: base, name: "Base" as const },
    { data: aggressive, name: "Aggressive" as const },
  ];

  return (
    <div className="space-y-3">
      {/* Card view on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {scenarios.map(({ data, name }) => (
          <div key={name} className={cn("rounded-xl border p-5", SCENARIO_STYLES[name])}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={cn("text-sm font-semibold", HEADER_STYLES[name])}>{name}</h4>
              {name === "Base" && (
                <span className="text-xs bg-accent-500/20 text-accent-400 border border-accent-500/30 px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>
            <div className="space-y-3">
              {COLS.map((col) => (
                <div key={col.key} className="flex justify-between items-baseline">
                  <span className="text-xs text-white/40">{col.label}</span>
                  <span className={cn(
                    "text-sm font-mono font-medium tabular-nums",
                    col.key === "ebitdaY3" && (data[col.key] as number) < 0 ? "text-red-400" : "text-white"
                  )}>
                    {col.format(data[col.key] as number)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
