"use client";

import { useMemo, useState } from "react";
import { Sliders, RotateCcw } from "lucide-react";
import { runFinancialEngine } from "@/lib/financial-engine";
import { formatCurrency, formatCurrencyCompact, formatNumber, formatPercent } from "@/lib/utils";
import type { ModelOutputs, QuestionnaireAnswers, GrowthCurve, ChurnEstimate, Currency } from "@/lib/types";
import { useT } from "@/i18n/LocaleProvider";

interface SensitivityAnalysisProps {
  baseModel: ModelOutputs;
}

interface OverrideState {
  monthlyBurn: number;
  cac: number;
  year1UserTarget: number;
  fundingAsk: number;
  monthlyChurnRate: number; // percent (e.g. 3.5)
  growthCurve: GrowthCurve;
  arpuMultiplier: number;   // 1 = no change, 1.2 = +20%
  cogsAdjustment: number;   // -0.1 .. +0.1 added to default cogs rate
}

const GROWTH_CURVES: GrowthCurve[] = ["conservative", "base", "aggressive"];

const CHURN_ESTIMATE_FROM_RATE = (rate: number): ChurnEstimate => {
  if (rate < 2) return "lt2";
  if (rate < 5) return "2to5";
  if (rate < 10) return "5to10";
  return "gt10";
};

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  baseValue: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  hint?: string;
  vsBaseLabel: string;
  baseLabel: string;
}

function SliderRow({ label, value, min, max, step, baseValue, format, onChange, hint, vsBaseLabel, baseLabel }: SliderRowProps) {
  const delta = baseValue !== 0 ? ((value - baseValue) / baseValue) * 100 : 0;
  const deltaSign = delta > 0.5 ? "+" : delta < -0.5 ? "" : "";
  const deltaColor =
    Math.abs(delta) < 0.5
      ? "text-gray-400"
      : delta > 0
      ? "text-emerald-600"
      : "text-rose-600";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
          {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
        </div>
        <div className="text-right tabular-nums">
          <p className="text-base font-bold text-gray-900 font-mono">{format(value)}</p>
          <p className={`text-xs font-mono ${deltaColor}`}>
            {deltaSign}
            {delta.toFixed(1)}% {vsBaseLabel}
          </p>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
        <span>{format(min)}</span>
        <span>{baseLabel} {format(baseValue)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

interface MetricChangeProps {
  label: string;
  value: string;
  baseValue: string;
  delta?: number;
  positive?: boolean; // is "more" good?
  highlight?: boolean;
  baseLabel: string;
}

function MetricChange({ label, value, baseValue, delta, positive = true, highlight, baseLabel }: MetricChangeProps) {
  const sign = delta != null && delta > 0 ? "+" : "";
  const isUp = (delta ?? 0) > 0;
  const isGood = positive ? isUp : !isUp;
  const color =
    delta == null || Math.abs(delta) < 0.5
      ? "text-gray-400"
      : isGood
      ? "text-emerald-600"
      : "text-rose-600";

  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight ? "border-blue-200 bg-blue-50/40" : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-xl font-extrabold text-gray-900 font-mono tabular-nums mt-1">{value}</p>
      <div className="flex items-baseline justify-between mt-1">
        <p className="text-[10px] text-gray-400 font-mono">{baseLabel} {baseValue}</p>
        {delta != null && (
          <p className={`text-[10px] font-mono ${color}`}>
            {sign}
            {delta.toFixed(1)}%
          </p>
        )}
      </div>
    </div>
  );
}

export function SensitivityAnalysis({ baseModel }: SensitivityAnalysisProps) {
  const { t } = useT();
  const a = baseModel.answers;
  const currency: Currency | undefined = baseModel.currency;
  const baseChurnRate =
    a.monthlyChurnRate > 0
      ? a.monthlyChurnRate
      : a.churnEstimate === "lt2"
      ? 1.5
      : a.churnEstimate === "2to5"
      ? 3.5
      : a.churnEstimate === "5to10"
      ? 7.5
      : a.churnEstimate === "gt10"
      ? 12
      : 5;

  const initialOverrides: OverrideState = useMemo(
    () => ({
      monthlyBurn: a.monthlyBurn,
      cac: a.cac || 250,
      year1UserTarget: a.year1UserTarget || 500,
      fundingAsk: a.fundingAsk,
      monthlyChurnRate: baseChurnRate,
      growthCurve: a.growthCurve,
      arpuMultiplier: 1,
      cogsAdjustment: 0,
    }),
    [a, baseChurnRate]
  );

  const [overrides, setOverrides] = useState<OverrideState>(initialOverrides);

  const set = <K extends keyof OverrideState>(key: K, value: OverrideState[K]) =>
    setOverrides((prev) => ({ ...prev, [key]: value }));

  const reset = () => setOverrides(initialOverrides);

  // Build the perturbed answers and re-run the engine.
  const stressedModel = useMemo<ModelOutputs>(() => {
    const stressedTiers = a.tiers.map((t) => ({
      ...t,
      monthlyPrice: Math.max(0, Math.round(t.monthlyPrice * overrides.arpuMultiplier)),
    }));
    const stressedStreams = (a.revenueStreams ?? []).map((s) => ({
      ...s,
      monthlyRevenue: Math.max(0, Math.round(s.monthlyRevenue * overrides.arpuMultiplier)),
    }));

    const stressedAnswers: QuestionnaireAnswers = {
      ...a,
      tiers: stressedTiers,
      revenueStreams: stressedStreams,
      monthlyBurn: overrides.monthlyBurn,
      cac: overrides.cac,
      year1UserTarget: overrides.year1UserTarget,
      fundingAsk: overrides.fundingAsk,
      monthlyChurnRate: overrides.monthlyChurnRate,
      churnEstimate: CHURN_ESTIMATE_FROM_RATE(overrides.monthlyChurnRate),
      growthCurve: overrides.growthCurve,
    };

    const stressed = runFinancialEngine(stressedAnswers);

    if (overrides.cogsAdjustment !== 0) {
      // The engine treats COGS as a fixed industry rate; apply a manual COGS shift on top.
      const adjMonthly = stressed.monthly.map((m) => {
        const newCogs = Math.max(0, m.cogs + m.revenue * overrides.cogsAdjustment);
        const newGross = m.revenue - newCogs;
        const newEbitda = newGross - m.opex;
        const newTax = newEbitda > 0 ? newEbitda * 0.2 : 0;
        const newNet = newEbitda - newTax;
        return { ...m, cogs: newCogs, grossProfit: newGross, ebitda: newEbitda, tax: newTax, netIncome: newNet };
      });
      // Recompute closingCash chain.
      let cash = stressedAnswers.fundingAsk;
      const withCash = adjMonthly.map((m) => {
        const opening = cash;
        cash = Math.max(0, opening + m.netIncome);
        return { ...m, openingCash: opening, closingCash: cash };
      });
      // Re-aggregate annual.
      const annual = [1, 2, 3].map((yr) => {
        const slice = withCash.slice((yr - 1) * 12, yr * 12);
        const revenue = slice.reduce((s, m) => s + m.revenue, 0);
        const cogs = slice.reduce((s, m) => s + m.cogs, 0);
        const grossProfit = slice.reduce((s, m) => s + m.grossProfit, 0);
        const opex = slice.reduce((s, m) => s + m.opex, 0);
        const ebitda = slice.reduce((s, m) => s + m.ebitda, 0);
        const netIncome = slice.reduce((s, m) => s + m.netIncome, 0);
        const last = slice[slice.length - 1];
        return {
          year: yr,
          label: `Year ${yr}`,
          revenue,
          cogs,
          grossProfit,
          grossMargin: revenue > 0 ? grossProfit / revenue : 0,
          opex,
          ebitda,
          ebitdaMargin: revenue > 0 ? ebitda / revenue : 0,
          netIncome,
          endingUsers: last?.totalUsers ?? 0,
          arr: (last?.revenue ?? 0) * 12,
        };
      });
      return { ...stressed, monthly: withCash, annual };
    }

    return stressed;
  }, [a, overrides]);

  const lastIdx = baseModel.annual.length - 1;
  const lastLabel = baseModel.annual[lastIdx]?.label ?? `Year ${baseModel.annual.length}`;
  const baseY3 = baseModel.annual[lastIdx];
  const sY3 = stressedModel.annual[stressedModel.annual.length - 1];
  const horizonMonths = baseModel.horizonMonths ?? baseModel.monthly.length;
  const baseUE = baseModel.unitEconomics;
  const sUE = stressedModel.unitEconomics;
  const baseRunway = baseModel.runway;
  const sRunway = stressedModel.runway;

  const pctDelta = (s: number, b: number) => (b !== 0 ? ((s - b) / Math.abs(b)) * 100 : 0);
  const vsBase = t("sens.delta_vs_base");
  const baseLbl = t("sens.base_label");
  const curveLabel = (c: GrowthCurve) =>
    c === "conservative" ? t("sc.conservative") : c === "base" ? t("sc.base") : t("sc.aggressive");

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 flex items-start gap-3">
        <Sliders className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{t("sens.intro_title")}</p>
          <p className="text-xs text-gray-600 mt-0.5">
            {t("sens.intro_body")}
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t("common.reset")}
        </button>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          {t("sens.live_impact")}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricChange
            label={`${lastLabel} ARR`}
            value={formatCurrencyCompact(sY3.arr, currency)}
            baseValue={formatCurrencyCompact(baseY3.arr, currency)}
            delta={pctDelta(sY3.arr, baseY3.arr)}
            positive
            highlight
            baseLabel={baseLbl}
          />
          <MetricChange
            label={`${lastLabel} EBITDA`}
            value={formatCurrencyCompact(sY3.ebitda, currency)}
            baseValue={formatCurrencyCompact(baseY3.ebitda, currency)}
            delta={pctDelta(sY3.ebitda, baseY3.ebitda)}
            positive
            baseLabel={baseLbl}
          />
          <MetricChange
            label={t("sc.runway_label")}
            value={sRunway.cashPositive ? `${horizonMonths}mo+` : `${sRunway.runwayMonths}mo`}
            baseValue={baseRunway.cashPositive ? `${horizonMonths}mo+` : `${baseRunway.runwayMonths}mo`}
            delta={pctDelta(sRunway.runwayMonths, baseRunway.runwayMonths)}
            positive
            baseLabel={baseLbl}
          />
          <MetricChange
            label={`${t("sc.customers_last").replace("(last year)", `(${lastLabel})`)}`}
            value={formatNumber(sY3.endingUsers)}
            baseValue={formatNumber(baseY3.endingUsers)}
            delta={pctDelta(sY3.endingUsers, baseY3.endingUsers)}
            positive
            baseLabel={baseLbl}
          />
          <MetricChange
            label="LTV / CAC"
            value={`${sUE.ltvCacRatio.toFixed(2)}x`}
            baseValue={`${baseUE.ltvCacRatio.toFixed(2)}x`}
            delta={pctDelta(sUE.ltvCacRatio, baseUE.ltvCacRatio)}
            positive
            baseLabel={baseLbl}
          />
          <MetricChange
            label={t("ue.payback_label")}
            value={sUE.paybackMonths.toFixed(1)}
            baseValue={baseUE.paybackMonths.toFixed(1)}
            delta={pctDelta(sUE.paybackMonths, baseUE.paybackMonths)}
            positive={false}
            baseLabel={baseLbl}
          />
          <MetricChange
            label={`${t("pl.gross_margin_pct")} (${lastLabel})`}
            value={formatPercent(sY3.grossMargin)}
            baseValue={formatPercent(baseY3.grossMargin)}
            delta={(sY3.grossMargin - baseY3.grossMargin) * 100}
            positive
            baseLabel={baseLbl}
          />
          <MetricChange
            label={t("pg.break_even")}
            value={sRunway.breakEvenYear ? `Y${sRunway.breakEvenYear}` : "Y3+"}
            baseValue={baseRunway.breakEvenYear ? `Y${baseRunway.breakEvenYear}` : "Y3+"}
            baseLabel={baseLbl}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <SliderRow
          label={t("sens.slider_monthly_burn")}
          value={overrides.monthlyBurn}
          min={Math.max(1000, Math.round(a.monthlyBurn * 0.4))}
          max={Math.round(a.monthlyBurn * 2.5)}
          step={500}
          baseValue={a.monthlyBurn}
          format={(v) => formatCurrencyCompact(v, currency)}
          onChange={(v) => set("monthlyBurn", v)}
          hint={t("sens.slider_monthly_burn_hint")}
          vsBaseLabel={vsBase}
          baseLabel={baseLbl}
        />
        <SliderRow
          label={t("sens.slider_cac")}
          value={overrides.cac}
          min={Math.max(10, Math.round((a.cac || 250) * 0.3))}
          max={Math.round((a.cac || 250) * 3)}
          step={10}
          baseValue={a.cac || 250}
          format={(v) => formatCurrency(v, 0, currency)}
          onChange={(v) => set("cac", v)}
          hint={t("sens.slider_cac_hint")}
          vsBaseLabel={vsBase}
          baseLabel={baseLbl}
        />
        <SliderRow
          label={t("sens.slider_churn")}
          value={overrides.monthlyChurnRate}
          min={0.1}
          max={20}
          step={0.1}
          baseValue={baseChurnRate}
          format={(v) => `${v.toFixed(1)}%`}
          onChange={(v) => set("monthlyChurnRate", v)}
          hint={t("sens.slider_churn_hint")}
          vsBaseLabel={vsBase}
          baseLabel={baseLbl}
        />
        <SliderRow
          label={t("sens.slider_year1_target")}
          value={overrides.year1UserTarget}
          min={Math.max(10, Math.round((a.year1UserTarget || 500) * 0.2))}
          max={Math.round((a.year1UserTarget || 500) * 4)}
          step={10}
          baseValue={a.year1UserTarget || 500}
          format={(v) => formatNumber(v)}
          onChange={(v) => set("year1UserTarget", v)}
          hint={t("sens.slider_year1_target_hint")}
          vsBaseLabel={vsBase}
          baseLabel={baseLbl}
        />
        <SliderRow
          label={t("sens.slider_funding_ask")}
          value={overrides.fundingAsk}
          min={Math.max(50000, Math.round(a.fundingAsk * 0.25))}
          max={Math.round(a.fundingAsk * 4)}
          step={25000}
          baseValue={a.fundingAsk}
          format={(v) => formatCurrencyCompact(v, currency)}
          onChange={(v) => set("fundingAsk", v)}
          hint={t("sens.slider_funding_ask_hint")}
          vsBaseLabel={vsBase}
          baseLabel={baseLbl}
        />
        <SliderRow
          label={t("sens.slider_arpu_mult")}
          value={overrides.arpuMultiplier}
          min={0.5}
          max={2}
          step={0.05}
          baseValue={1}
          format={(v) => `${v.toFixed(2)}x`}
          onChange={(v) => set("arpuMultiplier", v)}
          hint={t("sens.slider_arpu_mult_hint")}
          vsBaseLabel={vsBase}
          baseLabel={baseLbl}
        />
        <SliderRow
          label={t("sens.slider_cogs_adj")}
          value={overrides.cogsAdjustment}
          min={-0.15}
          max={0.15}
          step={0.01}
          baseValue={0}
          format={(v) => `${(v * 100 > 0 ? "+" : "")}${(v * 100).toFixed(0)}pp`}
          onChange={(v) => set("cogsAdjustment", v)}
          hint={t("sens.slider_cogs_adj_hint")}
          vsBaseLabel={vsBase}
          baseLabel={baseLbl}
        />
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t("sens.growth_scenario_card")}</p>
          <div className="grid grid-cols-3 gap-2">
            {GROWTH_CURVES.map((curve) => (
              <button
                key={curve}
                type="button"
                onClick={() => set("growthCurve", curve)}
                className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                  overrides.growthCurve === curve
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {curveLabel(curve)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {t("sens.growth_scenario_hint")}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
          {t("sens.what_this_tells")}
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">
          {t("sens.what_this_body")}
        </p>
      </div>
    </div>
  );
}
