"use client";

import { cn, formatCurrencyCompact, formatNumber, formatPercent } from "@/lib/utils";
import type { AnnualSummary, Currency } from "@/lib/types";

interface PLTableProps {
  annual: AnnualSummary[];
  compact?: boolean;
  currency?: Currency;
}

const fmtPct = (value: number) => formatPercent(value, 1);

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

export function PLTable({ annual, compact = false, currency }: PLTableProps) {
  const fmt = (v: number) => formatCurrencyCompact(v, currency);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 text-gray-500 font-semibold w-48">Metric</th>
            {annual.map((yr) => (
              <th key={yr.year} className="text-right py-3 px-4 text-gray-700 font-semibold">
                {yr.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className={cn(
                "border-b border-gray-100 transition-colors",
                row.highlight ? "bg-blue-50/40" : "hover:bg-gray-50/60"
              )}
            >
              <td
                className={cn(
                  "py-3 px-4",
                  row.indent ? "pl-8 text-gray-500" : "text-gray-700",
                  row.bold && "font-semibold text-gray-900"
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
                      row.bold ? "font-semibold text-gray-900" : "text-gray-600",
                      row.highlight && "text-blue-700 font-semibold",
                      isNeg && !row.isPercent && "text-red-600"
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
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <td className="py-3 px-4 text-gray-400 text-xs uppercase tracking-wider font-semibold" colSpan={annual.length + 1}>
                  Operational KPIs
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50/60">
                <td className="py-3 px-4 text-gray-700">Paying Customers (EOP)</td>
                {annual.map((yr) => (
                  <td key={yr.year} className="py-3 px-4 text-right font-mono text-gray-600 tabular-nums">
                    {formatNumber(yr.endingUsers)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50/60">
                <td className="py-3 px-4 text-gray-900 font-semibold">ARR (Year-end)</td>
                {annual.map((yr) => (
                  <td key={yr.year} className="py-3 px-4 text-right font-mono text-gray-900 font-semibold tabular-nums">
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
