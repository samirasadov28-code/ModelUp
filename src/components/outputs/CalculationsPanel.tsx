"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Calculator } from "lucide-react";
import { formatCurrency as fmtRaw, formatNumber, formatPercent } from "@/lib/utils";
import type { ModelOutputs } from "@/lib/types";
import { useT } from "@/i18n/LocaleProvider";

const COGS_RATES: Record<string, number> = {
  saas: 0.18,
  marketplace: 0.35,
  product: 0.45,
  service: 0.25,
  other: 0.30,
};

const GROWTH_RATES = {
  conservative: 0.04,
  base: 0.09,
  aggressive: 0.18,
};

const CHURN_RATES: Record<string, number> = {
  lt2: 0.015,
  "2to5": 0.035,
  "5to10": 0.075,
  gt10: 0.12,
  unknown: 0.05,
};

const STAGE_MULTIPLES: Record<string, number> = {
  "pre-seed": 8,
  seed: 10,
  "series-a": 12,
  "series-b": 15,
};

interface FormulaProps {
  label: string;
  expression: string;
  plugged: string;
  result: string;
  note?: string;
}

function Formula({ label, expression, plugged, result, note }: FormulaProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{label}</p>
      <p className="text-sm font-mono text-gray-700 leading-relaxed">{expression}</p>
      <p className="text-sm font-mono text-gray-500 leading-relaxed mt-1">= {plugged}</p>
      <p className="text-base font-bold font-mono text-blue-700 mt-1">= {result}</p>
      {note && <p className="text-xs text-gray-500 mt-2">{note}</p>}
    </div>
  );
}

interface SectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, description, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-3 px-5 py-4 hover:bg-gray-50/60 transition-colors text-left"
      >
        <div>
          <h3 className="text-gray-900 font-semibold text-base">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        {open ? (
          <ChevronDown className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 grid md:grid-cols-2 gap-3 bg-gray-50/40">
          {children}
        </div>
      )}
    </div>
  );
}

interface CalculationsPanelProps {
  model: ModelOutputs;
}

export function CalculationsPanel({ model }: CalculationsPanelProps) {
  const { t } = useT();
  const { answers, annual, monthly, unitEconomics, runway, capTable, currency } = model;
  const formatCurrency = (v: number, fd: 0 | 2 = 0) => fmtRaw(v, fd, currency);
  const cogsRate = COGS_RATES[answers.businessModel] ?? 0.25;
  const grossMarginRate = 1 - cogsRate;
  const growthRate = GROWTH_RATES[answers.growthCurve];
  const churnRate =
    answers.monthlyChurnRate > 0
      ? answers.monthlyChurnRate / 100
      : CHURN_RATES[answers.churnEstimate] ?? 0.05;
  const stageMultiple = STAGE_MULTIPLES[answers.fundingStage] ?? 10;

  const m12 = monthly[11];
  const m12Revenue = m12?.revenue ?? 0;
  const m12Users = m12?.totalUsers ?? 0;
  const arpu = unitEconomics.blendedArpu;
  const lastMonth = monthly[monthly.length - 1];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 flex items-start gap-3">
        <Calculator className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-gray-900">{t("calc.intro_title")}</p>
          <p className="text-xs text-gray-600 mt-0.5">
            {t("calc.intro_body")}{" "}
            <span className="text-blue-700 font-medium">{t("calc.intro_cta")}</span>
          </p>
        </div>
      </div>

      <Section
        title={t("calc.sec_growth_title")}
        description={t("calc.sec_growth_desc")}
      >
        <Formula
          label="Monthly growth rate"
          expression="growth_rate = curve_lookup(growthCurve)"
          plugged={`growth_rate(${answers.growthCurve})`}
          result={formatPercent(growthRate)}
          note={`Conservative ≈ 4%, Base ≈ 9%, Aggressive ≈ 18% per month.`}
        />
        <Formula
          label="Monthly churn rate"
          expression="churn_rate = monthly_churn ?? bucket_lookup(churnEstimate)"
          plugged={`churn_rate(${answers.churnEstimate})`}
          result={formatPercent(churnRate)}
        />
        <Formula
          label="Starting customers (month 1)"
          expression="start_users = round(year1_target × 5%)"
          plugged={`round(${formatNumber(answers.year1UserTarget)} × 0.05)`}
          result={formatNumber(Math.round(answers.year1UserTarget * 0.05))}
          note="The model boots from 5% of your year-1 target so growth has runway to compound to plan."
        />
        <Formula
          label="End-of-month customers"
          expression="end_users = users + (users × growth_rate) − (users × churn_rate)"
          plugged={`prev × (1 + ${(growthRate * 100).toFixed(1)}% − ${(churnRate * 100).toFixed(1)}%)`}
          result={`Month 12: ${formatNumber(m12Users)} customers`}
        />
      </Section>

      <Section
        title={t("calc.sec_revenue_title")}
        description={t("calc.sec_revenue_desc")}
      >
        <Formula
          label="Monthly revenue"
          expression={
            answers.revenueStreams && answers.revenueStreams.length > 0
              ? "revenue = Σ tier_users × tier_price + Σ stream_revenue × stream_factor"
              : "revenue = Σ tier_users × tier_price"
          }
          plugged={
            answers.revenueStreams && answers.revenueStreams.length > 0
              ? `Σ over ${answers.tiers.length || 1} tier${answers.tiers.length === 1 ? "" : "s"} + ${answers.revenueStreams.length} extra stream${answers.revenueStreams.length === 1 ? "" : "s"}`
              : `Σ over ${answers.tiers.length || 1} tier${answers.tiers.length === 1 ? "" : "s"}`
          }
          result={`Month 12: ${formatCurrency(m12Revenue)}`}
          note={
            answers.revenueStreams && answers.revenueStreams.length > 0
              ? "Streams marked 'scales with users' grow proportionally with the customer base; flat streams add the same amount each month."
              : undefined
          }
        />
        <Formula
          label="Year-end ARR"
          expression="ARR = last_month_revenue × 12"
          plugged={`${formatCurrency(lastMonth?.revenue ?? 0)} × 12`}
          result={formatCurrency(annual[annual.length - 1].arr)}
          note={`Year 3 ARR captures the run-rate at the end of the forecast.`}
        />
        <Formula
          label="COGS rate"
          expression={`cogs_rate = industry_lookup(${answers.businessModel})`}
          plugged={`cogs_rate(${answers.businessModel})`}
          result={formatPercent(cogsRate, 0)}
          note="SaaS ≈ 18%, marketplace ≈ 35%, product ≈ 45%, service ≈ 25%."
        />
        <Formula
          label="Gross profit (Year 3)"
          expression="gross_profit = revenue × (1 − cogs_rate)"
          plugged={`${formatCurrency(annual[annual.length - 1].revenue)} × ${formatPercent(grossMarginRate, 0)}`}
          result={formatCurrency(annual[annual.length - 1].grossProfit)}
        />
        <Formula
          label="Gross margin (Year 3)"
          expression="gross_margin = gross_profit / revenue"
          plugged={`${formatCurrency(annual[annual.length - 1].grossProfit)} / ${formatCurrency(annual[annual.length - 1].revenue)}`}
          result={formatPercent(annual[annual.length - 1].grossMargin, 1)}
        />
      </Section>

      <Section
        title={t("calc.sec_opex_title")}
        description={t("calc.sec_opex_desc")}
      >
        <Formula
          label="Base OpEx"
          expression="base_opex = monthly_burn × headcount_multiplier"
          plugged={`${formatCurrency(answers.monthlyBurn)} × headcount(${answers.headcount})`}
          result={formatCurrency(answers.monthlyBurn * (answers.headcount === "15+" ? 1.6 : answers.headcount === "6–15" ? 1.3 : 1.0))}
          note="Headcount multiplier: 1× (≤5), 1.3× (6–15), 1.6× (15+)."
        />
        <Formula
          label="Monthly OpEx"
          expression="opex = base_opex × (1 + 0.8% × month_index)"
          plugged="grows ~1% per month for tooling, hires, infra"
          result={`Month 12: ${formatCurrency(monthly[11]?.opex ?? 0)}`}
        />
        <Formula
          label="EBITDA"
          expression="ebitda = gross_profit − opex"
          plugged={`Year 3: ${formatCurrency(annual[annual.length - 1].grossProfit)} − ${formatCurrency(annual[annual.length - 1].opex)}`}
          result={formatCurrency(annual[annual.length - 1].ebitda)}
        />
        <Formula
          label="Tax"
          expression="tax = max(0, ebitda × 20%)"
          plugged={`max(0, ${formatCurrency(annual[annual.length - 1].ebitda)} × 20%)`}
          result={formatCurrency(Math.max(0, annual[annual.length - 1].ebitda * 0.2))}
        />
        <Formula
          label="Net income"
          expression="net_income = ebitda − tax"
          plugged={`Year 3: ${formatCurrency(annual[annual.length - 1].ebitda)} − ${formatCurrency(Math.max(0, annual[annual.length - 1].ebitda * 0.2))}`}
          result={formatCurrency(annual[annual.length - 1].netIncome)}
        />
      </Section>

      <Section
        title={t("calc.sec_ue_title")}
        description={t("calc.sec_ue_desc")}
      >
        <Formula
          label="Blended ARPU"
          expression="arpu = month_12_revenue / month_12_customers"
          plugged={`${formatCurrency(m12Revenue)} / ${formatNumber(m12Users)}`}
          result={formatCurrency(arpu, 2)}
          note="Per-customer monthly revenue, weighted across tiers."
        />
        <Formula
          label="Customer Acquisition Cost"
          expression="cac = your_input"
          plugged={`Your CAC entry${answers.cac > 0 ? "" : " (defaulted to ARPU × 3)"}`}
          result={formatCurrency(unitEconomics.cac)}
        />
        <Formula
          label="Lifetime Value"
          expression="ltv = (arpu × gross_margin) / churn_rate"
          plugged={`(${formatCurrency(arpu, 2)} × ${formatPercent(grossMarginRate, 0)}) / ${formatPercent(churnRate, 1)}`}
          result={formatCurrency(unitEconomics.ltv)}
        />
        <Formula
          label="LTV / CAC ratio"
          expression="ratio = ltv / cac"
          plugged={`${formatCurrency(unitEconomics.ltv)} / ${formatCurrency(unitEconomics.cac)}`}
          result={`${unitEconomics.ltvCacRatio.toFixed(2)}x`}
          note="≥3× is healthy, 1–3× is acceptable, <1× signals unit economics issues."
        />
        <Formula
          label="CAC payback"
          expression="payback_months = cac / (arpu × gross_margin)"
          plugged={`${formatCurrency(unitEconomics.cac)} / (${formatCurrency(arpu, 2)} × ${formatPercent(grossMarginRate, 0)})`}
          result={`${unitEconomics.paybackMonths.toFixed(1)} months`}
        />
      </Section>

      <Section
        title={t("calc.sec_runway_title")}
        description={t("calc.sec_runway_desc")}
      >
        <Formula
          label="Opening cash"
          expression="opening_cash = funding_ask"
          plugged={formatCurrency(answers.fundingAsk)}
          result={formatCurrency(answers.fundingAsk)}
        />
        <Formula
          label="Monthly cash flow"
          expression="cash_t = max(0, cash_(t−1) + net_income_t)"
          plugged="Month-by-month rollforward"
          result={runway.cashPositive ? `Stays positive across ${monthly.length} months` : `Cash runs out at month ${runway.runwayMonths}`}
        />
        <Formula
          label="Cash runway"
          expression="runway = months until closing_cash ≤ 0"
          plugged={runway.cashPositive ? "Cash never depletes in the forecast" : `${runway.runwayMonths} months from start`}
          result={runway.cashPositive ? `${monthly.length}mo+` : `${runway.runwayMonths} months`}
        />
        <Formula
          label="Break-even month"
          expression="break_even = first_month where ebitda ≥ 0"
          plugged={runway.breakEvenMonth ? `Month ${runway.breakEvenMonth}` : "Not within forecast"}
          result={runway.breakEvenYear ? `Year ${runway.breakEvenYear}` : "Year 3+"}
        />
      </Section>

      <Section
        title={t("calc.sec_captable_title")}
        description={t("calc.sec_captable_desc")}
        defaultOpen={false}
      >
        <Formula
          label="Stage multiple"
          expression={`multiple = stage_lookup(${answers.fundingStage})`}
          plugged={`stage(${answers.fundingStage})`}
          result={`${stageMultiple}× ARR`}
          note="Pre-seed ≈ 8×, seed ≈ 10×, Series A ≈ 12×, Series B+ ≈ 15× Year-1 ARR."
        />
        <Formula
          label="Pre-money valuation"
          expression="pre_money = year1_arr × stage_multiple"
          plugged={`${formatCurrency(annual[0].arr)} × ${stageMultiple}`}
          result={formatCurrency(capTable.preMoneyValuation)}
        />
        <Formula
          label="Post-money valuation"
          expression="post_money = pre_money + raise"
          plugged={`${formatCurrency(capTable.preMoneyValuation)} + ${formatCurrency(capTable.raiseAmount)}`}
          result={formatCurrency(capTable.postMoneyValuation)}
        />
        <Formula
          label="New investor equity %"
          expression="new_equity_pct = raise / post_money"
          plugged={`${formatCurrency(capTable.raiseAmount)} / ${formatCurrency(capTable.postMoneyValuation)}`}
          result={formatPercent(capTable.newEquityPercent, 1)}
        />
        <Formula
          label="Price per share"
          expression="ppshare = raise / new_shares_issued"
          plugged={`${formatCurrency(capTable.raiseAmount)} / ${formatNumber(capTable.entries.find((e) => e.shareholder === "New Investors")?.sharesPostRaise ?? 0)}`}
          result={formatCurrency(capTable.pricePerShare, 2)}
        />
      </Section>
    </div>
  );
}

