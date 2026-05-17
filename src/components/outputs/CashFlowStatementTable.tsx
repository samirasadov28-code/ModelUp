"use client";

import { formatCurrencyCompact } from "@/lib/utils";
import type { CashFlowStatement, Currency } from "@/lib/types";
import { useT } from "@/i18n/LocaleProvider";

interface CashFlowStatementTableProps {
  cashFlow: CashFlowStatement;
  currency?: Currency;
}

interface RowConfig {
  label: string;
  key: keyof import("@/lib/types").CashFlowYear;
  indent?: boolean;
  bold?: boolean;
  total?: boolean;
}

export function CashFlowStatementTable({ cashFlow, currency }: CashFlowStatementTableProps) {
  const { t } = useT();
  const ROWS: RowConfig[] = [
    { label: t("cf.net_income_post_tax"), key: "netIncome", indent: true },
    { label: t("cf.plus_da"), key: "depreciationAmortisation", indent: true },
    { label: t("cf.plus_wc"), key: "workingCapitalChanges", indent: true },
    { label: t("cf.cash_from_ops"), key: "cashFromOperations", total: true },
    { label: t("cf.capex"), key: "capex", indent: true },
    { label: t("cf.cash_from_investing"), key: "cashFromInvesting", total: true },
    { label: t("cf.equity_raised"), key: "equityRaised", indent: true },
    { label: t("cf.debt_raised"), key: "debtRaised", indent: true },
    { label: t("cf.cash_from_financing"), key: "cashFromFinancing", total: true },
    { label: t("cf.net_change_in_cash"), key: "netChangeInCash", bold: true },
    { label: t("cf.beginning_cash"), key: "beginningCash", indent: true },
    { label: t("cf.ending_cash"), key: "endingCash", bold: true },
  ];
  const fmt = (v: number) => formatCurrencyCompact(v, currency);
  const years = cashFlow.years;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 text-gray-500 font-semibold w-72">{t("cf.line_item")}</th>
            {years.map((y) => (
              <th
                key={y.year}
                className="text-right py-3 px-4 text-gray-700 font-semibold tabular-nums"
              >
                {y.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr
              key={r.key}
              className={`border-b border-gray-100 ${r.total ? "bg-gray-50/60" : "hover:bg-gray-50/60"}`}
            >
              <td
                className={`py-2.5 px-4 ${
                  r.indent ? "pl-8 text-gray-600" : r.bold || r.total ? "font-semibold text-gray-900" : "text-gray-700"
                }`}
              >
                {r.label}
              </td>
              {years.map((y) => {
                const v = y[r.key] as number;
                const isNeg = v < 0;
                return (
                  <td
                    key={y.year}
                    className={`py-2.5 px-4 text-right font-mono tabular-nums ${
                      r.bold || r.total ? "font-semibold text-gray-900" : "text-gray-600"
                    } ${isNeg ? "text-rose-600" : ""}`}
                  >
                    {fmt(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
