"use client";

import { cn, formatCurrencyCompact, formatNumber } from "@/lib/utils";
import type { ScenarioMetrics, Currency } from "@/lib/types";
import { useT } from "@/i18n/LocaleProvider";

interface ScenarioComparisonProps {
  base: ScenarioMetrics;
  conservative: ScenarioMetrics;
  aggressive: ScenarioMetrics;
  currency?: Currency;
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
  const { t } = useT();
  const fmt = (v: number) => formatCurrencyCompact(v, currency);
  const COLS = [
    { key: "revenueY1" as keyof ScenarioMetrics, label: t("sc.revenue_y1"), format: fmt },
    { key: "revenueY2" as keyof ScenarioMetrics, label: t("sc.revenue_y2"), format: fmt },
    { key: "revenueLast" as keyof ScenarioMetrics, label: t("sc.revenue_last"), format: fmt },
    { key: "arrLast" as keyof ScenarioMetrics, label: t("sc.arr_last"), format: fmt },
    { key: "ebitdaLast" as keyof ScenarioMetrics, label: t("sc.ebitda_last"), format: fmt },
    { key: "totalUsersLast" as keyof ScenarioMetrics, label: t("sc.customers_last"), format: (v: number) => formatNumber(v) },
    { key: "runwayMonths" as keyof ScenarioMetrics, label: t("sc.runway_label"), format: (v: number) => v >= 60 ? "60mo+" : `${v}mo` },
  ];
  const scenarios = [
    { data: conservative, name: "Conservative" as const, displayName: t("sc.conservative") },
    { data: base, name: "Base" as const, displayName: t("sc.base") },
    { data: aggressive, name: "Aggressive" as const, displayName: t("sc.aggressive") },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {scenarios.map(({ data, name, displayName }) => (
          <div key={name} className={cn("rounded-xl border p-5 shadow-sm", SCENARIO_STYLES[name])}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={cn("text-sm font-bold uppercase tracking-wider", HEADER_STYLES[name])}>{displayName}</h4>
              {name === "Base" && (
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
                  {t("sc.selected")}
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
