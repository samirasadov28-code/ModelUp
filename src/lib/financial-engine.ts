import { v4 as uuidv4 } from "uuid";
import type {
  QuestionnaireAnswers,
  ModelOutputs,
  MonthlyDataPoint,
  AnnualSummary,
  UnitEconomics,
  RunwayData,
  ScenarioMetrics,
  CapTableData,
  CostBreakdown,
  CostComponent,
  ModelType,
  GrowthCurve,
  Currency,
  RevenueModel,
  ValuationData,
  FundingStage,
  CashFlowStatement,
  SourcesAndUsesData,
  MultipleValuation,
  BusinessModel,
} from "./types";
import {
  defaultJurisdictionForGeography,
  payrollLoadingForJurisdiction,
  resolveCurrency,
  taxRateForJurisdiction,
  valuationMultipleForStage,
} from "./regional";
import { formatCurrency as fmt } from "./utils";

const MONTHS = 60;              // 5-year horizon
const YEARS = MONTHS / 12;       // 5

const GROWTH_RATES: Record<GrowthCurve, number> = {
  conservative: 0.04,
  base: 0.09,
  aggressive: 0.18,
};

// Industry-blended COGS rate used for subscription/marketplace/service revenue.
// Production revenue uses per-unit cost instead.
const COGS_RATES: Record<string, number> = {
  saas: 0.18,
  marketplace: 0.35,
  product: 0.45,
  service: 0.25,
  other: 0.30,
};

/**
 * Breakdown of the industry COGS rate into named sub-components so the
 * Calculations panel / Excel can show *why* the rate is what it is.
 */
const COGS_COMPONENT_SHARES: Record<string, { label: string; share: number; note?: string }[]> = {
  saas: [
    { label: "Cloud hosting & infra",  share: 0.05, note: "AWS / GCP / Azure spend that scales with active users." },
    { label: "Payment processing",     share: 0.03, note: "Stripe / Adyen merchant fees on subscription billing." },
    { label: "Customer support",       share: 0.05, note: "Support reps + tooling per active customer." },
    { label: "Third-party APIs",       share: 0.05, note: "Email, SMS, AI inference, data — usage-priced vendors." },
  ],
  marketplace: [
    { label: "Payment processing",     share: 0.12, note: "Higher than SaaS because of split-payout flows + chargebacks." },
    { label: "Trust & safety / insurance", share: 0.08, note: "Fraud checks, insurance, escrow." },
    { label: "Cloud hosting & infra",  share: 0.05 },
    { label: "Marketplace operations", share: 0.10, note: "Onboarding, dispute resolution, content moderation." },
  ],
  product: [
    { label: "Cost of goods sold",     share: 0.30, note: "Raw materials + direct labor + assembly." },
    { label: "Shipping & fulfillment", share: 0.10, note: "3PL, packaging, last-mile carriers." },
    { label: "Returns & breakage",     share: 0.05, note: "Typical return rate × processing cost." },
  ],
  service: [
    { label: "Delivery labor",         share: 0.20, note: "Consultant / engineer hours at fully-loaded cost." },
    { label: "Travel & onsite",        share: 0.03 },
    { label: "Subcontractors",         share: 0.02 },
  ],
  other: [
    { label: "Direct cost of revenue", share: 0.25 },
    { label: "Variable third-party costs", share: 0.05 },
  ],
};

function resolveChurnRate(answers: QuestionnaireAnswers): number {
  if (answers.monthlyChurnRate > 0) return answers.monthlyChurnRate / 100;
  const map: Record<string, number> = {
    lt2: 0.015, "2to5": 0.035, "5to10": 0.075, gt10: 0.12, unknown: 0.05,
  };
  return map[answers.churnEstimate] ?? 0.05;
}

function monthLabel(startDate: Date, offset: number): string {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleString("default", { month: "short", year: "2-digit" });
}

function headcountMultiplier(headcount: string): number {
  if (headcount === "6–15" || headcount === "6-15") return 1.3;
  if (headcount === "15+") return 1.6;
  return 1.0;
}

function resolveRevenueModel(answers: QuestionnaireAnswers): RevenueModel {
  if (answers.revenueModel) return answers.revenueModel;
  // Auto-infer: if the user provided unit-economics fields, treat it as
  // production; otherwise subscription is the safe default.
  const hasUnitFields = (answers.unitsYear1 ?? 0) > 0 && (answers.unitPrice ?? 0) > 0;
  return hasUnitFields ? "production" : "subscription";
}

function computeMonthly(
  answers: QuestionnaireAnswers,
  curve: GrowthCurve,
  openingCashOverride?: number,
  taxRateOverride?: number
): MonthlyDataPoint[] {
  const monthlyGrowth = GROWTH_RATES[curve];
  const monthlyChurn = resolveChurnRate(answers);
  const cogsRate = COGS_RATES[answers.businessModel] ?? 0.25;
  const startDate = answers.modelStartDate ? new Date(answers.modelStartDate) : new Date();
  const revenueModel = resolveRevenueModel(answers);

  // Subscription tier setup ────────────────────────────────────────────────
  const tiers = answers.tiers.length > 0
    ? answers.tiers
    : [{
        name: "Standard",
        monthlyPrice: answers.avgMonthlySpend ?? answers.acv ? (answers.acv ?? 500) / 12 : 50,
        allocationPercent: 100,
      }];
  const totalAlloc = tiers.reduce((s, t) => s + t.allocationPercent, 0);
  const normTiers = tiers.map((t) => ({
    ...t,
    allocationPercent: t.allocationPercent / (totalAlloc || 100),
  }));

  let users = answers.year1UserTarget > 0 ? Math.round(answers.year1UserTarget * 0.05) : 50;
  const startingUsers = Math.max(1, users);
  const extraStreams = answers.revenueStreams ?? [];

  // Production setup ───────────────────────────────────────────────────────
  // Units in month 1 derived as ~1/12 of year-1 target adjusted slightly down
  // so growth has runway; volume grows by unitMonthlyVolumeGrowth (defaults to
  // the same growth rate the subscription side uses).
  const unitsYear1 = Math.max(0, answers.unitsYear1 ?? 0);
  const unitPrice = Math.max(0, answers.unitPrice ?? 0);
  const unitCost = Math.max(0, answers.unitCost ?? 0);
  const volumeGrowth = answers.unitMonthlyVolumeGrowth ?? monthlyGrowth;
  // Solve for starting units so cumulative Y1 units roughly equals unitsYear1.
  // Σ_{m=0..11} u0 × (1 + g)^m = u0 × ((1+g)^12 − 1)/g.  → u0 = target / ratio.
  let units = 0;
  if (unitsYear1 > 0 && volumeGrowth > 0) {
    const ratio = (Math.pow(1 + volumeGrowth, 12) - 1) / volumeGrowth;
    units = Math.max(1, unitsYear1 / Math.max(1, ratio));
  } else if (unitsYear1 > 0) {
    units = unitsYear1 / 12;
  }

  const initialCash = openingCashOverride ?? answers.fundingAsk;
  let cash = initialCash;
  const data: MonthlyDataPoint[] = [];

  const jurisdiction =
    answers.taxJurisdiction ?? defaultJurisdictionForGeography(answers.geography);
  const taxRate = taxRateOverride ?? taxRateForJurisdiction(jurisdiction);

  const baseOpex = answers.monthlyBurn * headcountMultiplier(answers.headcount);

  for (let m = 0; m < MONTHS; m++) {
    const opexGrowthFactor = 1 + m * 0.008;
    const opex = baseOpex * opexGrowthFactor;

    // ── Customers (subscription side) ──
    const newUsers = Math.round(users * monthlyGrowth);
    const churnedUsers = Math.round(users * monthlyChurn);
    const endUsers = Math.max(0, users + newUsers - churnedUsers);

    const tierBreakdown = normTiers.map((t) => {
      const tierUsers = Math.round(endUsers * t.allocationPercent);
      const tierRevenue = tierUsers * t.monthlyPrice;
      return { name: t.name, users: tierUsers, revenue: tierRevenue };
    });
    const tierRevenue = tierBreakdown.reduce((s, t) => s + t.revenue, 0);

    const userScale = endUsers / startingUsers;
    const otherStreamsRevenue = extraStreams.reduce((s, stream) => {
      const factor = stream.scalesWithUsers ? userScale : 1;
      return s + Math.max(0, stream.monthlyRevenue) * factor;
    }, 0);

    // ── Units (production side) ──
    const unitsThisMonth = units;
    const unitRevenue = unitsThisMonth * unitPrice;
    const unitCogsForMonth = unitsThisMonth * unitCost;

    // ── Combine revenue + COGS per revenue model ──
    let revenue: number;
    let cogs: number;
    if (revenueModel === "production") {
      revenue = unitRevenue;
      cogs = unitCogsForMonth;
    } else if (revenueModel === "hybrid") {
      revenue = tierRevenue + otherStreamsRevenue + unitRevenue;
      // Subscription COGS uses the industry rate; production COGS uses unit cost.
      const subsCogs = (tierRevenue + otherStreamsRevenue) * cogsRate;
      cogs = subsCogs + unitCogsForMonth;
    } else {
      revenue = tierRevenue + otherStreamsRevenue;
      cogs = revenue * cogsRate;
    }

    const grossProfit = revenue - cogs;
    const ebitda = grossProfit - opex;
    const tax = ebitda > 0 ? ebitda * taxRate : 0;
    const netIncome = ebitda - tax;

    const openingCash = cash;
    cash = Math.max(0, cash + netIncome);

    data.push({
      month: m + 1,
      label: monthLabel(startDate, m),
      totalUsers: endUsers,
      newUsers,
      churnedUsers,
      revenue,
      cogs,
      grossProfit,
      opex,
      ebitda,
      tax,
      netIncome,
      openingCash,
      closingCash: cash,
      tierBreakdown,
    });

    users = endUsers;
    units = units * (1 + volumeGrowth);
  }

  return data;
}

function aggregateAnnual(monthly: MonthlyDataPoint[]): AnnualSummary[] {
  return Array.from({ length: YEARS }, (_, i) => i + 1).map((yr) => {
    const slice = monthly.slice((yr - 1) * 12, yr * 12);
    const revenue = slice.reduce((s, m) => s + m.revenue, 0);
    const cogs = slice.reduce((s, m) => s + m.cogs, 0);
    const grossProfit = slice.reduce((s, m) => s + m.grossProfit, 0);
    const opex = slice.reduce((s, m) => s + m.opex, 0);
    const ebitda = slice.reduce((s, m) => s + m.ebitda, 0);
    const netIncome = slice.reduce((s, m) => s + m.netIncome, 0);
    const lastMonth = slice[slice.length - 1];
    const arr = (lastMonth?.revenue ?? 0) * 12;

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
      endingUsers: lastMonth?.totalUsers ?? 0,
      arr,
    };
  });
}

function computeUnitEconomics(
  answers: QuestionnaireAnswers,
  monthly: MonthlyDataPoint[],
  _annual: AnnualSummary[]
): UnitEconomics {
  const churnRate = resolveChurnRate(answers);
  const cogsRate = COGS_RATES[answers.businessModel] ?? 0.25;
  const grossMarginRate = 1 - cogsRate;
  const revenueModel = resolveRevenueModel(answers);

  const m12 = monthly[11];
  let blendedArpu: number;
  if (revenueModel === "production") {
    // For production businesses ARPU is meaningless — use month-12 revenue /
    // active-user proxy or fall back to unit price as the "per-event" figure.
    blendedArpu = answers.unitPrice ?? (m12 && m12.totalUsers > 0 ? m12.revenue / m12.totalUsers : 0);
  } else {
    blendedArpu = m12 && m12.totalUsers > 0
      ? m12.revenue / m12.totalUsers
      : answers.tiers.length > 0
      ? answers.tiers.reduce((s, t) => s + t.monthlyPrice * (t.allocationPercent / 100), 0)
      : 50;
  }

  const cac = answers.cac > 0 ? answers.cac : blendedArpu * 3;
  const ltv = churnRate > 0 ? (blendedArpu * grossMarginRate) / churnRate : blendedArpu * 24;
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;
  const paybackMonths = cac > 0 && blendedArpu * grossMarginRate > 0
    ? cac / (blendedArpu * grossMarginRate)
    : 24;

  const cacStatus: UnitEconomics["cacStatus"] =
    ltvCacRatio >= 3 ? "green" : ltvCacRatio >= 1 ? "amber" : "red";

  return {
    blendedArpu,
    cac,
    ltv,
    ltvCacRatio,
    paybackMonths,
    grossMarginRate,
    cacStatus,
  };
}

function computeRunway(
  answers: QuestionnaireAnswers,
  monthly: MonthlyDataPoint[],
  annual: AnnualSummary[]
): RunwayData {
  const startDate = answers.modelStartDate ? new Date(answers.modelStartDate) : new Date();

  let breakEvenMonth: number | null = null;
  let cashRunoutMonth: number | null = null;
  let firstProfitableMonth: number | null = null;

  for (let i = 0; i < monthly.length; i++) {
    if (breakEvenMonth === null && monthly[i].ebitda >= 0 && i > 0) {
      breakEvenMonth = monthly[i].month;
    }
    if (firstProfitableMonth === null && monthly[i].netIncome > 0 && i > 0) {
      firstProfitableMonth = monthly[i].month;
    }
    if (cashRunoutMonth === null && monthly[i].closingCash <= 0 && i > 0) {
      cashRunoutMonth = monthly[i].month;
    }
  }

  const runwayMonths = cashRunoutMonth ?? MONTHS;
  const runwayDate = new Date(startDate);
  runwayDate.setMonth(runwayDate.getMonth() + runwayMonths);

  const breakEvenYear = breakEvenMonth != null ? Math.ceil(breakEvenMonth / 12) : null;

  // First full year where post-tax net income > 0 (annual basis).
  const profitYear = annual.find((a) => a.netIncome > 0);
  const firstProfitableYear = profitYear ? profitYear.year : null;

  return {
    equityRaise: answers.fundingAsk,
    monthlyBurnAtStart: answers.monthlyBurn,
    runwayMonths,
    runwayEndDate: runwayDate.toISOString().slice(0, 7),
    cashPositive: cashRunoutMonth === null,
    breakEvenMonth,
    breakEvenYear,
    firstProfitableMonth,
    firstProfitableYear,
  };
}

function buildScenario(answers: QuestionnaireAnswers, curve: GrowthCurve): ScenarioMetrics {
  const monthly = computeMonthly(answers, curve);
  const annual = aggregateAnnual(monthly);
  const runway = computeRunway(answers, monthly, annual);
  const lastYear = annual[annual.length - 1];

  return {
    label: curve.charAt(0).toUpperCase() + curve.slice(1),
    revenueY1: annual[0].revenue,
    revenueY2: annual[1]?.revenue ?? 0,
    revenueY3: annual[2]?.revenue ?? 0,
    revenueY5: annual[4]?.revenue ?? lastYear.revenue,
    ebitdaY3: annual[2]?.ebitda ?? lastYear.ebitda,
    ebitdaY5: annual[4]?.ebitda ?? lastYear.ebitda,
    runwayMonths: runway.runwayMonths,
    totalUsersY3: annual[2]?.endingUsers ?? lastYear.endingUsers,
    totalUsersY5: annual[4]?.endingUsers ?? lastYear.endingUsers,
    arrY3: annual[2]?.arr ?? lastYear.arr,
    arrY5: annual[4]?.arr ?? lastYear.arr,
    revenueLast: lastYear.revenue,
    ebitdaLast: lastYear.ebitda,
    totalUsersLast: lastYear.endingUsers,
    arrLast: lastYear.arr,
  };
}

function buildCapTable(answers: QuestionnaireAnswers, annual: AnnualSummary[]): CapTableData {
  const arrY1 = annual[0].arr;
  const jurisdiction =
    answers.taxJurisdiction ?? defaultJurisdictionForGeography(answers.geography);
  const revenueMultiple = valuationMultipleForStage(answers.fundingStage, jurisdiction);

  const preMoneyValuation = arrY1 > 0 ? arrY1 * revenueMultiple : answers.fundingAsk * 4;
  const postMoneyValuation = preMoneyValuation + answers.fundingAsk;
  const newEquityPercent = answers.fundingAsk / postMoneyValuation;
  const foundersPercent = 1 - newEquityPercent;
  const totalShares = 10_000_000;
  const newShares = Math.round(totalShares * newEquityPercent);
  const founderShares = totalShares - newShares;
  const pricePerShare = answers.fundingAsk / newShares;

  return {
    entries: [
      {
        shareholder: "Founders",
        sharesPreRaise: totalShares,
        sharesPostRaise: founderShares,
        ownershipPreRaise: 1,
        ownershipPostRaise: foundersPercent,
      },
      {
        shareholder: "New Investors",
        sharesPreRaise: 0,
        sharesPostRaise: newShares,
        ownershipPreRaise: 0,
        ownershipPostRaise: newEquityPercent,
      },
    ],
    preMoneyValuation,
    postMoneyValuation,
    raiseAmount: answers.fundingAsk,
    newEquityPercent,
    pricePerShare,
  };
}

function buildCostBreakdown(
  answers: QuestionnaireAnswers,
  monthly: MonthlyDataPoint[]
): CostBreakdown {
  const revenueModel = resolveRevenueModel(answers);
  const jurisdiction =
    answers.taxJurisdiction ?? defaultJurisdictionForGeography(answers.geography);
  const payroll = payrollLoadingForJurisdiction(jurisdiction);

  // Reference month — month 12 (representative steady-state) — so the
  // component amounts shown are meaningful instead of near-zero month 1.
  const refMonth = monthly[11] ?? monthly[monthly.length - 1];
  const refRevenue = refMonth?.revenue ?? 0;

  // COGS components ────────────────────────────────────────────────────────
  let cogsComponents: CostComponent[];
  let cogsRate: number;

  if (revenueModel === "production") {
    const unitCost = Math.max(0, answers.unitCost ?? 0);
    const unitPrice = Math.max(0, answers.unitPrice ?? 1);
    const unitsAtRef = unitPrice > 0 ? refRevenue / unitPrice : 0;
    const materialsShare = 0.65; // typical split of unit cost
    const directLaborShare = 0.25;
    const otherShare = 0.10;
    cogsComponents = [
      {
        label: "Raw materials per unit",
        monthlyAmount: unitsAtRef * unitCost * materialsShare,
        share: materialsShare,
        note: `${(materialsShare * 100).toFixed(0)}% of the ${fmt(unitCost, 2, { code: "USD", symbol: "$", locale: "en-US" })}/unit direct cost.`,
      },
      {
        label: "Direct manufacturing labor",
        monthlyAmount: unitsAtRef * unitCost * directLaborShare,
        share: directLaborShare,
      },
      {
        label: "Packaging & other",
        monthlyAmount: unitsAtRef * unitCost * otherShare,
        share: otherShare,
      },
    ];
    cogsRate = unitPrice > 0 ? unitCost / unitPrice : 0;
  } else {
    cogsRate = COGS_RATES[answers.businessModel] ?? 0.25;
    const sharesDef = COGS_COMPONENT_SHARES[answers.businessModel] ?? COGS_COMPONENT_SHARES.other;
    cogsComponents = sharesDef.map((c) => ({
      label: c.label,
      monthlyAmount: refRevenue * c.share,
      share: c.share,
      note: c.note,
    }));
  }

  // OpEx components ────────────────────────────────────────────────────────
  // Split monthly burn into a typical early-stage allocation, then apply
  // payroll loading on top of the salary slice (the founder's input is
  // "what we pay today" — usually net cash to employees, not employer-side
  // gross). Loading uplift makes the bottom-line burn realistic.
  const burn = Math.max(0, answers.monthlyBurn);
  const salariesNetShare = 0.62; // 62% salaries (cash to employees)
  const toolsShare = 0.10;
  const marketingShare = 0.15;
  const officeShare = 0.06;
  const otherShare = 0.07;
  const salariesNet = burn * salariesNetShare;
  const payrollUplift = salariesNet * payroll.rate;
  const tools = burn * toolsShare;
  const marketing = burn * marketingShare;
  const office = burn * officeShare;
  const other = burn * otherShare;

  const opexComponents: CostComponent[] = [
    {
      label: "Salaries (cash to employees)",
      monthlyAmount: salariesNet,
      share: salariesNetShare,
      note: "Typical 60-65% of burn at pre-seed / seed stage.",
    },
    {
      label: payroll.label,
      monthlyAmount: payrollUplift,
      share: payroll.rate * salariesNetShare,
      note: "Employer-side burden on top of cash salaries — region-specific.",
    },
    { label: "Tools & software", monthlyAmount: tools, share: toolsShare },
    { label: "Marketing & sales", monthlyAmount: marketing, share: marketingShare },
    { label: "Office, infra & legal", monthlyAmount: office, share: officeShare },
    { label: "Other", monthlyAmount: other, share: otherShare },
  ];

  return {
    cogsComponents,
    cogsRate,
    opexComponents,
    payrollLoadingRate: payroll.rate,
    payrollLoadingLabel: payroll.label,
  };
}

function buildFundingNarrative(
  answers: QuestionnaireAnswers,
  annual: AnnualSummary[],
  runway: RunwayData,
  capTable: CapTableData,
  currency: Currency
): string {
  const company = answers.companyName || "The company";
  const raise = fmt(answers.fundingAsk, 0, currency);
  const stage = answers.fundingStage.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const proceedsText = answers.useOfProceeds.join(", ").toLowerCase();
  const runwayText = runway.cashPositive
    ? `well beyond the ${YEARS}-year model horizon`
    : `${runway.runwayMonths} months`;
  const breakEvenText = runway.breakEvenYear
    ? `Year ${runway.breakEvenYear}`
    : "within the forecast period";
  const last = annual[annual.length - 1];
  const lastUsers = last.endingUsers.toLocaleString("en-US");
  const lastArr = fmt(last.arr, 0, currency);

  return `${company} is raising ${raise} at ${stage}. The raise provides ${runwayText} of runway and funds ${proceedsText}. At target growth, the business reaches EBITDA breakeven in ${breakEvenText} with ${lastUsers} paying customers generating ${lastArr} ARR by ${last.label}. Post-raise, new investors receive ${(capTable.newEquityPercent * 100).toFixed(1)}% equity at a ${fmt(capTable.preMoneyValuation, 0, currency)} pre-money valuation.`;
}

/**
 * Stage-driven default discount rate. Investors demand a higher return for
 * earlier-stage risk: pre-seed ~35%, seed ~28%, series-A ~22%, series-B ~17%.
 * These are blended industry conventions — Pro users can refine via WACC.
 */
const STAGE_DISCOUNT_RATE: Record<FundingStage, number> = {
  "pre-seed": 0.35,
  seed: 0.28,
  "series-a": 0.22,
  "series-b": 0.17,
};

export function defaultDiscountRateForStage(stage: FundingStage): number {
  return STAGE_DISCOUNT_RATE[stage] ?? 0.25;
}

/**
 * DCF valuation. Uses post-tax EBITDA as a free-cash-flow proxy (v1 — we
 * don't yet track CAPEX or working capital separately) and adds a Gordon-
 * growth terminal value: TV = FCF_n × (1 + g) / (r − g).
 *
 * Falls back to a defensive Math.max so the math doesn't blow up when
 * r ≤ g (which only happens at very low discount rates).
 */
function buildValuation(
  answers: QuestionnaireAnswers,
  annual: AnnualSummary[]
): ValuationData {
  const discountRate =
    answers.discountRate && answers.discountRate > 0
      ? answers.discountRate
      : defaultDiscountRateForStage(answers.fundingStage);
  const terminalGrowthRate = answers.terminalGrowthRate ?? 0.03;

  const annualFcf = annual.map((a) => a.netIncome);
  const discountFactors = annual.map((_, i) => 1 / Math.pow(1 + discountRate, i + 1));
  const presentValues = annualFcf.map((fcf, i) => fcf * discountFactors[i]);
  const pvOfFcf = presentValues.reduce((s, v) => s + v, 0);

  const lastFcf = annualFcf[annualFcf.length - 1] ?? 0;
  const safeSpread = Math.max(0.02, discountRate - terminalGrowthRate);
  const terminalValue = (lastFcf * (1 + terminalGrowthRate)) / safeSpread;
  const pvOfTerminal = terminalValue * (discountFactors[discountFactors.length - 1] ?? 0);

  const enterpriseValue = pvOfFcf + pvOfTerminal;

  return {
    discountRate,
    terminalGrowthRate,
    annualFcf,
    discountFactors,
    presentValues,
    pvOfFcf,
    terminalValue,
    pvOfTerminal,
    enterpriseValue,
    multipleValuation: buildMultipleValuation(answers, annual),
  };
}

/**
 * Indirect-method cash flow statement, year by year. The early-stage engine
 * doesn't model D&A or working-capital changes yet, so cash from operations
 * = net income; investing = 0 (no CapEx); financing = funding ask in year 1.
 *
 * Ending cash matches the monthly engine's closing cash for the final month
 * of each year by construction.
 */
function buildCashFlowStatement(
  answers: QuestionnaireAnswers,
  monthly: MonthlyDataPoint[],
  annual: AnnualSummary[]
): CashFlowStatement {
  const years = annual.map((a, idx) => {
    const lastMonth = monthly[(idx + 1) * 12 - 1];
    const firstMonth = monthly[idx * 12];
    const equityRaised = idx === 0 ? answers.fundingAsk : 0;
    const cashFromOperations = a.netIncome;
    const cashFromInvesting = 0;
    const cashFromFinancing = equityRaised;
    const netChangeInCash = cashFromOperations + cashFromInvesting + cashFromFinancing;
    // Beginning cash for year 1 = 0 (the funding hits inside the year as a
    // financing inflow). For subsequent years it's the prior year's closing.
    const beginningCash = idx === 0 ? 0 : monthly[idx * 12 - 1]?.closingCash ?? 0;
    const endingCash = lastMonth?.closingCash ?? beginningCash + netChangeInCash;
    return {
      year: a.year,
      label: a.label,
      netIncome: a.netIncome,
      depreciationAmortisation: 0,
      workingCapitalChanges: 0,
      cashFromOperations,
      capex: 0,
      cashFromInvesting,
      equityRaised,
      debtRaised: 0,
      cashFromFinancing,
      netChangeInCash,
      beginningCash,
      endingCash,
    };
  });
  return { years };
}

/**
 * Sources & Uses table — classic deal-doc summary. Sources are the capital
 * coming in (equity raise, optional debt, optional existing cash). Uses are
 * the spend buckets allocated via Q10's `useOfProceedsAllocation`. When the
 * allocation doesn't sum to 100 we re-normalise so the totals balance.
 */
function buildSourcesAndUses(answers: QuestionnaireAnswers): SourcesAndUsesData {
  const totalRaise = answers.fundingAsk;

  const sources = [
    { label: "New equity (this round)", amount: totalRaise, percent: 1.0 },
  ];
  const totalSources = sources.reduce((s, r) => s + r.amount, 0);

  // Re-normalise allocations so they sum to 100 (defensive — Q10 already
  // forces this, but old localStorage models may pre-date the field).
  const alloc = answers.useOfProceedsAllocation ?? {};
  const proceeds = answers.useOfProceeds ?? [];
  const labelFor: Record<string, string> = {
    "product-dev": "Product development",
    hiring: "Hiring",
    marketing: "Marketing & sales",
    operations: "Operations",
    "working-capital": "Working capital",
  };
  const rawAllocSum = proceeds.reduce((s, k) => s + (alloc[k] ?? 0), 0);
  const usableSum = rawAllocSum > 0 ? rawAllocSum : 100;
  const uses = proceeds.length > 0
    ? proceeds.map((k) => {
        const pct = (alloc[k] ?? 0) / usableSum;
        return {
          label: labelFor[k] ?? k,
          amount: Math.round(totalRaise * pct),
          percent: pct,
        };
      })
    : [
        // Fallback when the founder didn't tag uses on Q10.
        { label: "General corporate use", amount: totalRaise, percent: 1.0 },
      ];
  const totalUses = uses.reduce((s, r) => s + r.amount, 0);

  return { sources, uses, totalSources, totalUses };
}

/**
 * EBITDA-multiple valuation using industry-typical ranges. SaaS gets fat
 * multiples; commodity services get tight ones. When EBITDA is negative we
 * fall back to revenue × revenue-multiple so the row stays defensible.
 */
function buildMultipleValuation(
  answers: QuestionnaireAnswers,
  annual: AnnualSummary[]
): MultipleValuation {
  const last = annual[annual.length - 1];
  const business = (answers.businessModel as BusinessModel) ?? "other";

  const EBITDA_MULTIPLES: Record<BusinessModel, [number, number, number]> = {
    saas: [10, 15, 22],
    marketplace: [8, 12, 18],
    product: [5, 8, 12],
    service: [3, 5, 8],
    other: [5, 8, 12],
  };

  const REVENUE_MULTIPLES: Record<BusinessModel, [number, number, number]> = {
    saas: [4, 7, 11],
    marketplace: [3, 5, 8],
    product: [1.5, 2.5, 4],
    service: [1, 1.5, 2.5],
    other: [2, 3, 5],
  };

  if (last.ebitda > 0) {
    const [low, base, high] = EBITDA_MULTIPLES[business];
    return {
      basis: "ebitda",
      baseAmount: last.ebitda,
      baseLabel: `${last.label} EBITDA`,
      lowMultiple: low,
      baseMultiple: base,
      highMultiple: high,
      lowValuation: last.ebitda * low,
      baseValuation: last.ebitda * base,
      highValuation: last.ebitda * high,
      note: `${business.toUpperCase()} private-comp EBITDA multiples — ${low}× low / ${base}× base / ${high}× high.`,
    };
  }

  // EBITDA negative → use revenue as the anchor. Use ARR (run-rate) which is
  // what investors actually value at this stage.
  const [low, base, high] = REVENUE_MULTIPLES[business];
  const baseAmount = last.arr;
  return {
    basis: "revenue",
    baseAmount,
    baseLabel: `${last.label} ARR (run-rate)`,
    lowMultiple: low,
    baseMultiple: base,
    highMultiple: high,
    lowValuation: baseAmount * low,
    baseValuation: baseAmount * base,
    highValuation: baseAmount * high,
    note: `EBITDA is negative in ${last.label} — switched to ARR × revenue multiple (${low}× / ${base}× / ${high}×).`,
  };
}

function selectModelType(answers: QuestionnaireAnswers): ModelType {
  if (resolveRevenueModel(answers) === "production") return "project_finance";
  if (
    answers.businessModel === "saas" ||
    (answers.businessModel === "product" && answers.customerType === "b2b")
  ) {
    return "saas";
  }
  if (answers.pricePerUnit != null || answers.constructionCost != null) {
    return "project_finance";
  }
  return "alternative";
}

function sourceModelFile(modelType: ModelType): string {
  switch (modelType) {
    case "project_finance": return "Generic PF.xlsb";
    case "alternative": return "StartUp Model Alternative.xlsx";
    default: return "StartUp Model.xlsx";
  }
}

export function runFinancialEngine(answers: QuestionnaireAnswers): ModelOutputs {
  const modelType = selectModelType(answers);
  const sourceModel = sourceModelFile(modelType);

  const jurisdiction =
    answers.taxJurisdiction ?? defaultJurisdictionForGeography(answers.geography);
  const taxRate = taxRateForJurisdiction(jurisdiction);
  const currency = resolveCurrency({
    geography: answers.geography,
    taxJurisdiction: jurisdiction,
  });

  const monthly = computeMonthly(answers, answers.growthCurve);
  const annual = aggregateAnnual(monthly);
  const unitEconomics = computeUnitEconomics(answers, monthly, annual);
  const runway = computeRunway(answers, monthly, annual);
  const capTable = buildCapTable(answers, annual);
  const costBreakdown = buildCostBreakdown(answers, monthly);
  const valuation = buildValuation(answers, annual);
  const cashFlow = buildCashFlowStatement(answers, monthly, annual);
  const sourcesAndUses = buildSourcesAndUses(answers);
  const fundingNarrative = buildFundingNarrative(answers, annual, runway, capTable, currency);

  const scenarios = {
    base: buildScenario(answers, "base"),
    conservative: buildScenario(answers, "conservative"),
    aggressive: buildScenario(answers, "aggressive"),
  };

  return {
    modelId: uuidv4(),
    modelType,
    sourceModel,
    createdAt: new Date().toISOString(),
    answers: { ...answers, taxJurisdiction: jurisdiction },
    monthly,
    annual,
    unitEconomics,
    runway,
    scenarios,
    capTable,
    valuation,
    cashFlow,
    sourcesAndUses,
    fundingNarrative,
    currency,
    taxRate,
    costBreakdown,
    horizonMonths: MONTHS,
  };
}
