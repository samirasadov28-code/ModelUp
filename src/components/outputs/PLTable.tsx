"use client";

import { cn } from "@/lib/utils";
import type { AnnualSummary } from "@/lib/types";

interface PLTableProps {
  annual: AnnualSummary[];
  compact?: boolean;
}

function fmt(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

function fmtPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const rows: { key: keyof AnnualSummary; label: string; indent?: boolean; bold?: boolean; isPercent?: boolean; highlight?: boolean }[] = [
  { key: "revenue", label: "Revenue", bold: true },
  { key: "cogs", label: "Cost of Revenue", indent: true },
  { key: "grossProfit", label: "Gross Profit", bold: true },
  { key: "grossMargin", label: "Gross Margin %", indent: true, isPercent: true },
  { key: "opex", label: "Operating Expenses", indent: true },
  { key: "ebitda", label: "EBITDA", bold: true, highlight: true },
  { key: "ebitdaMargin", label: "EBITDA Margin %", indent: true, isPercent: true },
  { key: "netIncome", label: "Net Income", bold: true },
];

export function PLTable({ annual, compact = false }: PLTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-4 text-white/40 font-medium w-48">Metric</th>
            {annual.map((yr) => (
              <th key={yr.year} className="text-right py-3 px-4 text-white/60 font-semibold">
                {yr.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.key}
              className={cn(
                "border-b border-white/5 transition-colors",
                row.highlight ? "bg-accent-500/5" : "hover:bg-white/3"
              )}
            >
              <td
                className={cn(
                  "py-3 px-4",
                  row.indent ? "pl-8 text-white/50" : "text-white/80",
                  row.bold && "font-semibold text-white"
                )}
              >
                {row.label}
              </td>
              {annual.map((yr) => {
                const raw = yr[row.key] as number;
                const isNeg = raw < 0;
                return (
                  <td
                    key={yr.year}
                    className={cn(
                      "py-3 px-4 text-right font-mono tabular-nums",
                      row.bold ? "font-semibold text-white" : "text-white/60",
                      row.highlight && "text-accent-400 font-semibold",
                      isNeg && !row.isPercent && "text-red-400"
                    )}
                  >
                    {row.isPercent ? fmtPct(raw) : fmt(raw)}
                  </td>
                );
              })}
            </tr>
          ))}

          {!compact && (
            <>
              <tr className="border-b border-white/5">
                <td className="py-3 px-4 text-white/40 text-xs uppercase tracking-wider" colSpan={annual.length + 1}>
                  Operational KPIs
                </td>
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/3">
                <td className="py-3 px-4 text-white/80">Paying Customers (EOP)</td>
                {annual.map((yr) => (
                  <td key={yr.year} className="py-3 px-4 text-right font-mono text-white/60 tabular-nums">
                    {yr.endingUsers.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/3">
                <td className="py-3 px-4 text-white/80 font-semibold">ARR (Year-end)</td>
                {annual.map((yr) => (
                  <td key={yr.year} className="py-3 px-4 text-right font-mono text-white font-semibold tabular-nums">
                    {fmt(yr.arr)}
                  </td>
                ))}
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
