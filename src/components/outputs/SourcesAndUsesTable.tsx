"use client";

import { formatCurrency, formatPercent } from "@/lib/utils";
import type { Currency, SourcesAndUsesData } from "@/lib/types";

interface SourcesAndUsesTableProps {
  data: SourcesAndUsesData;
  currency?: Currency;
}

export function SourcesAndUsesTable({ data, currency }: SourcesAndUsesTableProps) {
  const fmt = (v: number) => formatCurrency(v, 0, currency);
  const balanced = Math.abs(data.totalSources - data.totalUses) < 1;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Sources */}
      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-emerald-50/60 px-5 py-3 border-b border-emerald-100">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Sources</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Where the capital comes from</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-white">
              <th className="text-left py-2 px-4 text-gray-500 text-xs font-semibold">Source</th>
              <th className="text-right py-2 px-4 text-gray-500 text-xs font-semibold">%</th>
              <th className="text-right py-2 px-4 text-gray-500 text-xs font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.sources.map((row, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2.5 px-4 text-gray-700">{row.label}</td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-gray-600">
                  {formatPercent(row.percent, 1)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-gray-900 font-semibold">
                  {fmt(row.amount)}
                </td>
              </tr>
            ))}
            <tr className="bg-emerald-50/40">
              <td className="py-2.5 px-4 font-semibold text-emerald-700">Total sources</td>
              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                100.0%
              </td>
              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-bold">
                {fmt(data.totalSources)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Uses */}
      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-blue-50/60 px-5 py-3 border-b border-blue-100">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Uses</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Where the capital goes (from your Q10 allocation)
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-white">
              <th className="text-left py-2 px-4 text-gray-500 text-xs font-semibold">Use</th>
              <th className="text-right py-2 px-4 text-gray-500 text-xs font-semibold">%</th>
              <th className="text-right py-2 px-4 text-gray-500 text-xs font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.uses.map((row, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2.5 px-4 text-gray-700">{row.label}</td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-gray-600">
                  {formatPercent(row.percent, 1)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-gray-900 font-semibold">
                  {fmt(row.amount)}
                </td>
              </tr>
            ))}
            <tr className="bg-blue-50/40">
              <td className="py-2.5 px-4 font-semibold text-blue-700">Total uses</td>
              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-blue-700 font-semibold">
                100.0%
              </td>
              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-blue-700 font-bold">
                {fmt(data.totalUses)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="md:col-span-2">
        <p className={`text-xs ${balanced ? "text-gray-500" : "text-amber-600 font-semibold"}`}>
          {balanced
            ? "✓ Sources and Uses balance."
            : `Sources and Uses differ by ${fmt(data.totalSources - data.totalUses)} — check Q10 allocations.`}
        </p>
      </div>
    </div>
  );
}
