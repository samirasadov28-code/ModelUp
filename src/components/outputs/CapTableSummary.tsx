"use client";

import type { CapTableData } from "@/lib/types";
import { formatCurrency, formatCurrencyCompact, formatNumber, formatPercent } from "@/lib/utils";

const fmt = formatCurrencyCompact;
const fmtPrice = (value: number) => formatCurrency(value, 2);
const fmtPct = (value: number) => formatPercent(value, 1);

interface CapTableSummaryProps {
  capTable: CapTableData;
}

export function CapTableSummary({ capTable }: CapTableSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/3 p-4 text-center">
          <p className="text-xs text-white/40 mb-2">Pre-money Valuation</p>
          <p className="text-lg font-bold text-white font-mono">{fmt(capTable.preMoneyValuation)}</p>
        </div>
        <div className="rounded-xl border border-accent-500/30 bg-accent-500/5 p-4 text-center">
          <p className="text-xs text-white/40 mb-2">Raise Amount</p>
          <p className="text-lg font-bold text-accent-400 font-mono">{fmt(capTable.raiseAmount)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/3 p-4 text-center">
          <p className="text-xs text-white/40 mb-2">Post-money Valuation</p>
          <p className="text-lg font-bold text-white font-mono">{fmt(capTable.postMoneyValuation)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/3">
              <th className="text-left py-3 px-4 text-white/40 font-medium">Shareholder</th>
              <th className="text-right py-3 px-4 text-white/40 font-medium">Shares (pre)</th>
              <th className="text-right py-3 px-4 text-white/40 font-medium">Ownership (pre)</th>
              <th className="text-right py-3 px-4 text-white/40 font-medium">Shares (post)</th>
              <th className="text-right py-3 px-4 text-white/40 font-medium">Ownership (post)</th>
            </tr>
          </thead>
          <tbody>
            {capTable.entries.map((entry) => (
              <tr key={entry.shareholder} className="border-b border-white/5">
                <td className="py-3 px-4 text-white/80 font-medium">{entry.shareholder}</td>
                <td className="py-3 px-4 text-right font-mono text-white/60 tabular-nums">
                  {formatNumber(entry.sharesPreRaise)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-white/60 tabular-nums">
                  {fmtPct(entry.ownershipPreRaise)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-white tabular-nums">
                  {formatNumber(entry.sharesPostRaise)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-white tabular-nums font-semibold">
                  {fmtPct(entry.ownershipPostRaise)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-white/30 text-center">
        Price per share: {fmtPrice(capTable.pricePerShare)} · Based on {fmtPct(capTable.newEquityPercent)} new equity
      </p>
    </div>
  );
}
