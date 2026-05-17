"use client";

import type { CapTableData, Currency } from "@/lib/types";
import { formatCurrency, formatCurrencyCompact, formatNumber, formatPercent } from "@/lib/utils";
import { useT } from "@/i18n/LocaleProvider";

const fmtPct = (value: number) => formatPercent(value, 1);

interface CapTableSummaryProps {
  capTable: CapTableData;
  currency?: Currency;
}

export function CapTableSummary({ capTable, currency }: CapTableSummaryProps) {
  const { t } = useT();
  const fmt = (v: number) => formatCurrencyCompact(v, currency);
  const fmtPrice = (v: number) => formatCurrency(v, 2, currency);
  const shareholderLabel = (raw: string) => {
    if (raw === "Founders") return t("ct.founders");
    if (raw === "New Investors") return t("ct.new_investors");
    return raw;
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">{t("ct.pre_money_valuation")}</p>
          <p className="text-lg font-bold text-gray-900 font-mono">{fmt(capTable.preMoneyValuation)}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">{t("ct.raise_amount")}</p>
          <p className="text-lg font-bold text-blue-700 font-mono">{fmt(capTable.raiseAmount)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">{t("ct.post_money_valuation")}</p>
          <p className="text-lg font-bold text-gray-900 font-mono">{fmt(capTable.postMoneyValuation)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-gray-500 font-semibold">{t("ct.col_shareholder")}</th>
              <th className="text-right py-3 px-4 text-gray-500 font-semibold">{t("ct.col_shares_pre")}</th>
              <th className="text-right py-3 px-4 text-gray-500 font-semibold">{t("ct.col_ownership_pre")}</th>
              <th className="text-right py-3 px-4 text-gray-500 font-semibold">{t("ct.col_shares_post")}</th>
              <th className="text-right py-3 px-4 text-gray-500 font-semibold">{t("ct.col_ownership_post")}</th>
            </tr>
          </thead>
          <tbody>
            {capTable.entries.map((entry) => (
              <tr key={entry.shareholder} className="border-b border-gray-100 hover:bg-gray-50/60">
                <td className="py-3 px-4 text-gray-800 font-medium">{shareholderLabel(entry.shareholder)}</td>
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
        {t("ct.price_per_share_note", { price: fmtPrice(capTable.pricePerShare), pct: fmtPct(capTable.newEquityPercent) })}
      </p>
    </div>
  );
}
