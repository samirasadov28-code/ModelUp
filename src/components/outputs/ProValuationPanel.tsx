"use client";

import { useMemo, useState } from "react";
import { Calculator, RotateCcw } from "lucide-react";
import { formatCurrency, formatCurrencyCompact, formatPercent } from "@/lib/utils";
import type { ModelOutputs } from "@/lib/types";
import { useT } from "@/i18n/LocaleProvider";

interface ProValuationPanelProps {
  model: ModelOutputs;
}

interface WaccInputs {
  riskFreeRate: number;       // rf, e.g. 0.045
  equityRiskPremium: number;  // ERP, e.g. 0.055
  beta: number;               // β, e.g. 1.2
  costOfDebt: number;         // rD pre-tax, e.g. 0.08
  debtWeight: number;         // D / V, 0..1
  terminalGrowthRate: number; // g for Gordon growth, e.g. 0.03
}

function defaultInputsFor(model: ModelOutputs): WaccInputs {
  return {
    riskFreeRate: 0.045,
    equityRiskPremium: 0.055,
    beta: 1.2,
    costOfDebt: 0.08,
    debtWeight: 0,
    terminalGrowthRate: model.valuation?.terminalGrowthRate ?? 0.03,
  };
}

interface NumberRowProps {
  label: string;
  value: number;
  step: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  /** Display as percent — value is stored as a decimal. */
  asPercent?: boolean;
  hint?: string;
}

function NumberRow({ label, value, step, min, max, onChange, asPercent, hint }: NumberRowProps) {
  const displayValue = asPercent ? Math.round(value * 10000) / 100 : value;
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={Number.isFinite(displayValue) ? displayValue : 0}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(asPercent ? n / 100 : n);
          }}
          className="w-28 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
        />
        {asPercent && <span className="text-sm text-gray-500">%</span>}
      </div>
      {hint && <p className="text-[10px] text-gray-400 mt-1 leading-snug">{hint}</p>}
    </div>
  );
}

export function ProValuationPanel({ model }: ProValuationPanelProps) {
  const { t } = useT();
  const initial = useMemo(() => defaultInputsFor(model), [model]);
  const [w, setW] = useState<WaccInputs>(initial);
  const set = <K extends keyof WaccInputs>(key: K, v: WaccInputs[K]) =>
    setW((prev) => ({ ...prev, [key]: v }));
  const reset = () => setW(initial);

  const taxRate = model.taxRate ?? 0.25;
  const equityWeight = Math.max(0, Math.min(1, 1 - w.debtWeight));

  // CAPM cost of equity = rf + β × ERP
  const costOfEquity = w.riskFreeRate + w.beta * w.equityRiskPremium;
  // After-tax cost of debt
  const afterTaxCostOfDebt = w.costOfDebt * (1 - taxRate);
  // WACC = E/V × rE + D/V × rD × (1−t)
  const wacc = costOfEquity * equityWeight + afterTaxCostOfDebt * w.debtWeight;

  // DCF off the engine's annual net income with the user-tuned WACC
  const annualFcf = model.annual.map((a) => a.netIncome);
  const discountFactors = annualFcf.map((_, i) => 1 / Math.pow(1 + wacc, i + 1));
  const presentValues = annualFcf.map((fcf, i) => fcf * discountFactors[i]);
  const pvOfFcf = presentValues.reduce((s, v) => s + v, 0);
  const lastFcf = annualFcf[annualFcf.length - 1] ?? 0;
  const spread = Math.max(0.005, wacc - w.terminalGrowthRate);
  const terminalValue = (lastFcf * (1 + w.terminalGrowthRate)) / spread;
  const pvOfTerminal = terminalValue * (discountFactors[discountFactors.length - 1] ?? 0);
  const enterpriseValue = pvOfFcf + pvOfTerminal;

  // Sensitivity: 5×5 EV matrix across WACC ±2pp and g ±1pp
  const waccGrid = [-0.02, -0.01, 0, 0.01, 0.02].map((d) => wacc + d);
  const gGrid = [-0.01, -0.005, 0, 0.005, 0.01].map((d) => w.terminalGrowthRate + d);
  const sensitivity = waccGrid.map((r) =>
    gGrid.map((g) => {
      const spr = Math.max(0.005, r - g);
      const dfs = annualFcf.map((_, i) => 1 / Math.pow(1 + r, i + 1));
      const pvs = annualFcf.map((fcf, i) => fcf * dfs[i]);
      const tv = (lastFcf * (1 + g)) / spr;
      const pvTv = tv * (dfs[dfs.length - 1] ?? 0);
      return pvs.reduce((s, v) => s + v, 0) + pvTv;
    })
  );

  const currency = model.currency;
  const fmtMoney = (v: number) => formatCurrencyCompact(v, currency);
  const fmtFull = (v: number) => formatCurrency(v, 0, currency);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 flex items-start gap-3">
        <Calculator className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {t("pv.intro_title")}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            {t("pv.intro_body")}
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t("common.reset_btn")}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <NumberRow
          label={t("pv.in_rf")}
          asPercent
          value={w.riskFreeRate}
          step={0.1}
          min={0}
          max={20}
          onChange={(v) => set("riskFreeRate", v)}
          hint={t("pv.in_rf_hint")}
        />
        <NumberRow
          label={t("pv.in_erp")}
          asPercent
          value={w.equityRiskPremium}
          step={0.1}
          min={0}
          max={20}
          onChange={(v) => set("equityRiskPremium", v)}
          hint={t("pv.in_erp_hint")}
        />
        <NumberRow
          label={t("pv.in_beta")}
          value={w.beta}
          step={0.05}
          min={0}
          max={5}
          onChange={(v) => set("beta", v)}
          hint={t("pv.in_beta_hint")}
        />
        <NumberRow
          label={t("pv.in_rd")}
          asPercent
          value={w.costOfDebt}
          step={0.1}
          min={0}
          max={30}
          onChange={(v) => set("costOfDebt", v)}
          hint={t("pv.in_rd_hint")}
        />
        <NumberRow
          label={t("pv.in_dw")}
          asPercent
          value={w.debtWeight}
          step={1}
          min={0}
          max={100}
          onChange={(v) => set("debtWeight", Math.max(0, Math.min(1, v)))}
          hint={t("pv.in_dw_hint")}
        />
        <NumberRow
          label={t("pv.in_g")}
          asPercent
          value={w.terminalGrowthRate}
          step={0.1}
          min={0}
          max={15}
          onChange={(v) => set("terminalGrowthRate", v)}
          hint={t("pv.in_g_hint")}
        />
      </div>

      {/* Computed components */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
            {t("pv.card_re")}
          </p>
          <p className="text-xl font-bold text-gray-900 font-mono mt-1 tabular-nums">
            {formatPercent(costOfEquity, 2)}
          </p>
          <p className="text-[10px] text-gray-400 mt-1 font-mono">
            = {(w.riskFreeRate * 100).toFixed(1)}% + {w.beta.toFixed(2)} ×{" "}
            {(w.equityRiskPremium * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
            {t("pv.card_atcd")}
          </p>
          <p className="text-xl font-bold text-gray-900 font-mono mt-1 tabular-nums">
            {formatPercent(afterTaxCostOfDebt, 2)}
          </p>
          <p className="text-[10px] text-gray-400 mt-1 font-mono">
            = {(w.costOfDebt * 100).toFixed(1)}% × (1 − {(taxRate * 100).toFixed(1)}%)
          </p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-blue-700">
            {t("pv.card_wacc")}
          </p>
          <p className="text-xl font-bold text-blue-700 font-mono mt-1 tabular-nums">
            {formatPercent(wacc, 2)}
          </p>
          <p className="text-[10px] text-blue-600/70 mt-1 font-mono">
            = {(equityWeight * 100).toFixed(0)}% × rE + {(w.debtWeight * 100).toFixed(0)}% × rD(1−t)
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700">
            {t("pv.card_dcf_ev")}
          </p>
          <p className="text-xl font-bold text-emerald-700 font-mono mt-1 tabular-nums">
            {fmtMoney(enterpriseValue)}
          </p>
          <p className="text-[10px] text-emerald-700/70 mt-1">
            {t("pv.card_dcf_ev_sub")}
          </p>
        </div>
      </div>

      {/* DCF table */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          {t("pv.dcf_table_title")}
        </p>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2 text-gray-500 font-semibold">{t("pv.col_year")}</th>
                <th className="text-right px-4 py-2 text-gray-500 font-semibold">{t("pv.col_fcf")}</th>
                <th className="text-right px-4 py-2 text-gray-500 font-semibold">{t("pv.col_df")}</th>
                <th className="text-right px-4 py-2 text-gray-500 font-semibold">{t("pv.col_pv")}</th>
              </tr>
            </thead>
            <tbody>
              {annualFcf.map((fcf, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/60">
                  <td className="px-4 py-2 text-gray-700">{t("pv.year_n", { n: String(i + 1) })}</td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-gray-700">
                    {fmtFull(fcf)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-gray-500">
                    {discountFactors[i].toFixed(4)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-gray-900 font-semibold">
                    {fmtFull(presentValues[i])}
                  </td>
                </tr>
              ))}
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <td className="px-4 py-2 text-gray-700 font-semibold">
                  {t("pv.terminal_row", { n: String(annualFcf.length), g: formatPercent(w.terminalGrowthRate, 1) })}
                </td>
                <td className="px-4 py-2 text-right font-mono tabular-nums text-gray-700">
                  {fmtFull(terminalValue)}
                </td>
                <td className="px-4 py-2 text-right font-mono tabular-nums text-gray-500">
                  {(discountFactors[discountFactors.length - 1] ?? 0).toFixed(4)}
                </td>
                <td className="px-4 py-2 text-right font-mono tabular-nums text-gray-900 font-semibold">
                  {fmtFull(pvOfTerminal)}
                </td>
              </tr>
              <tr className="bg-blue-50/40">
                <td className="px-4 py-3 text-blue-700 font-bold">{t("pv.ev_row")}</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-blue-700 font-bold">
                  {fmtFull(enterpriseValue)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sensitivity matrix */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
          {t("pv.sens_title")}
        </p>
        <p className="text-xs text-gray-500 mb-3">
          {t("pv.sens_body")}
        </p>
        <div className="rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 text-gray-500 font-semibold">{t("pv.sens_corner")}</th>
                {gGrid.map((g, i) => (
                  <th
                    key={i}
                    className="text-right px-3 py-2 text-gray-500 font-semibold font-mono tabular-nums"
                  >
                    {formatPercent(g, 1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {waccGrid.map((r, ri) => (
                <tr key={ri} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-gray-500 font-mono tabular-nums">
                    {formatPercent(r, 2)}
                  </td>
                  {sensitivity[ri].map((ev, ci) => {
                    const isCenter = ri === 2 && ci === 2;
                    return (
                      <td
                        key={ci}
                        className={`px-3 py-2 text-right font-mono tabular-nums ${
                          isCenter
                            ? "bg-blue-50 text-blue-700 font-bold"
                            : "text-gray-700"
                        }`}
                      >
                        {fmtMoney(ev)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
