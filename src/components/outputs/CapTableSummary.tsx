"use client";

import type { CapTableData, Currency } from "@/lib/types";
import { formatCurrency, formatCurrencyCompact, formatNumber, formatPercent } from "@/lib/utils";

const fmtPct = (value: number) => formatPercent(value, 1);

interface CapTableSummaryProps {
  capTable: CapTableData;
  currency?: Currency;
}

export function CapTableSummary({ capTable, currency }: CapTableSummaryProps) {
  const fmt = (v: number) => formatCurrencyCompact(v, currency);
  const fmtPrice = (v: number) => formatCurrency(v, 2, currency);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Pre-money Valuation</p>
          <p className="text-lg font-bold text-gray-900 font-mono">{fmt(capTable.preMoneyValuation)}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Raise Amount</p>
          <p className="text-lg font-bold text-blue-700 font-mono">{fmt(capTable.raiseAmount)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Post-money Valuation</p>
          <p className="text-lg font-bold text-gray-900 font-mono">{fmt(capTable.postMoneyValuation)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-gray-500 font-semibold">Shareholder</th>
              <th className="text-right py-3 px-4 text-gray-500 font-semibold">Shares (pre)</th>
              <th className="text-right py-3 px-4 text-gray-500 font-semibold">Ownership (pre)</th>
              <th className="text-right py-3 px-4 text-gray-500 font-semibold">Shares (post)</th>
              <th className="text-right py-3 px-4 text-gray-500 font-semibold">Ownership (post)</th>
            </tr>
          </thead>
          <tbody>
            {capTable.entries.map((entry) => (
              <tr key={entry.shareholder} className="border-b border-gray-100 hover:bg-gray-50/60">
                <td className="py-3 px-4 text-gray-800 font-medium">{entry.shareholder}</td>
                <td className="py-3 px-4 text-right font-mono text-gray-600 tabular-nums">
                  {formatNumber(entry.sharesPreRaise)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-gray-600 tabular-nums">
                  {fmtPct(entry.ownershipPreRaise)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-gray-900 tabular-nums">
                  {formatNumber(entry.sharesPostRaise)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-gray-900 tabular-nums font-semibold">
                  {fmtPct(entry.ownershipPostRaise)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Price per share: {fmtPrice(capTable.pricePerShare)} · Based on {fmtPct(capTable.newEquityPercent)} new equity
      </p>
    </div>
  );
}
