"use client";

import { cn, formatCurrencyCompact, formatNumber } from "@/lib/utils";
import type { ScenarioMetrics, Currency } from "@/lib/types";

interface ScenarioComparisonProps {
  base: ScenarioMetrics;
  conservative: ScenarioMetrics;
  aggressive: ScenarioMetrics;
  currency?: Currency;
}

function buildCols(currency?: Currency) {
  const fmt = (v: number) => formatCurrencyCompact(v, currency);
  return [
    { key: "revenueY1" as keyof ScenarioMetrics, label: "Revenue Y1", format: fmt },
    { key: "revenueY2" as keyof ScenarioMetrics, label: "Revenue Y2", format: fmt },
    { key: "revenueY3" as keyof ScenarioMetrics, label: "Revenue Y3", format: fmt },
    { key: "arrY3" as keyof ScenarioMetrics, label: "ARR (EoY3)", format: fmt },
    { key: "ebitdaY3" as keyof ScenarioMetrics, label: "EBITDA Y3", format: fmt },
    { key: "totalUsersY3" as keyof ScenarioMetrics, label: "Customers Y3", format: (v: number) => formatNumber(v) },
    { key: "runwayMonths" as keyof ScenarioMetrics, label: "Runway", format: (v: number) => v >= 36 ? "36mo+" : `${v}mo` },
  ];
}

const SCENARIO_STYLES = {
  Conservative: "border-gray-200 bg-white",
  Base: "border-blue-200 bg-blue-50/60",
  Aggressive: "border-cyan-200 bg-cyan-50/60",
};

const HEADER_STYLES = {
  Conservative: "text-gray-700",
  Base: "text-blue-700",
  Aggressive: "text-cyan-700",
};

export function ScenarioComparison({ base, conservative, aggressive, currency }: ScenarioComparisonProps) {
  const COLS = buildCols(currency);
  const scenarios = [
    { data: conservative, name: "Conservative" as const },
    { data: base, name: "Base" as const },
    { data: aggressive, name: "Aggressive" as const },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {scenarios.map(({ data, name }) => (
          <div key={name} className={cn("rounded-xl border p-5 shadow-sm", SCENARIO_STYLES[name])}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={cn("text-sm font-bold uppercase tracking-wider", HEADER_STYLES[name])}>{name}</h4>
              {name === "Base" && (
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
                  Selected
                </span>
              )}
            </div>
            <div className="space-y-3">
              {COLS.map((col) => (
                <div key={col.key} className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">{col.label}</span>
                  <span className={cn(
                    "text-sm font-mono font-semibold tabular-nums",
                    col.key === "ebitdaY3" && (data[col.key] as number) < 0 ? "text-red-600" : "text-gray-900"
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
