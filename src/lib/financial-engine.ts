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
  ModelType,
  GrowthCurve,
} from "./types";

const MONTHS = 36;

const GROWTH_RATES: Record<GrowthCurve, number> = {
  conservative: 0.04,
  base: 0.09,
  aggressive: 0.18,
};

const COGS_RATES: Record<string, number> = {
  saas: 0.18,
  marketplace: 0.35,
  product: 0.45,
  service: 0.25,
  other: 0.30,
};

function resolveChurnRate(answers: QuestionnaireAnswers): number {
  if (answers.monthlyChurnRate > 0) return answers.monthlyChurnRate / 100;
  const map: Record<string, number> = {
    lt2: 0.015,
    "2to5": 0.035,
    "5to10": 0.075,
    gt10: 0.12,
    unknown: 0.05,
  };
  return map[answers.churnEstimate] ?? 0.05;
}

function monthLabel(startDate: Date, offset: number): string {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleString("default", { month: "short", year: "2-digit" });
}

function computeMonthly(
  answers: QuestionnaireAnswers,
  curve: GrowthCurve,
  openingCashOverride?: number
): MonthlyDataPoint[] {
  const monthlyGrowth = GROWTH_RATES[curve];
  const monthlyChurn = resolveChurnRate(answers);
  const cogsRate = COGS_RATES[answers.businessModel] ?? 0.25;
  const startDate = answers.modelStartDate
    ? new Date(answers.modelStartDate)
    : new Date();

  const tiers = answers.tiers.length > 0
    ? answers.tiers
    : [{ name: "Standard", monthlyPrice: answers.avgMonthlySpend ?? answers.acv ? (answers.acv ?? 500) / 12 : 50, allocationPercent: 100 }];

  const totalAlloc = tiers.reduce((s, t) => s + t.allocationPercent, 0);
  const normTiers = tiers.map((t) => ({
    ...t,
    allocationPercent: t.allocationPercent / (totalAlloc || 100),
  }));

  let users = answers.year1UserTarget > 0
    ? Math.round(answers.year1UserTarget * 0.05)
    : 50;
  const startingUsers = Math.max(1, users);
  const extraStreams = answers.revenueStreams ?? [];

  const initialCash = openingCashOverride ?? answers.fundingAsk;
  let cash = initialCash;
  const data: MonthlyDataPoint[] = [];

  // OpEx scaling — starts at burn, grows slowly with headcount additions
  const headcountMultiplier =
    answers.headcount === "6–15" || answers.headcount === "6-15" ? 1.3
    : answers.headcount === "15+" ? 1.6
    : 1.0;
  const baseOpex = answers.monthlyBurn * headcountMultiplier;

  for (let m = 0; m < MONTHS; m++) {
    const opexGrowthFactor = 1 + m * 0.008; // ~1% monthly OpEx creep
    const opex = baseOpex * opexGrowthFactor;

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
    const revenue = tierRevenue + otherStreamsRevenue;
    const cogs = revenue * cogsRate;
    const grossProfit = revenue - cogs;
    const ebitda = grossProfit - opex;
    const tax = ebitda > 0 ? ebitda * 0.2 : 0;
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
  }

  return data;
}

function aggregateAnnual(monthly: MonthlyDataPoint[]): AnnualSummary[] {
  return [1, 2, 3].map((yr) => {
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
  annual: AnnualSummary[]
): UnitEconomics {
  const churnRate = resolveChurnRate(answers);
  const cogsRate = COGS_RATES[answers.businessModel] ?? 0.25;
  const grossMarginRate = 1 - cogsRate;

  // Blended ARPU from month 12 as representative
  const m12 = monthly[11];
  const blendedArpu = m12 && m12.totalUsers > 0
    ? m12.revenue / m12.totalUsers
    : answers.tiers.length > 0
    ? answers.tiers.reduce((s, t) => s + t.monthlyPrice * (t.allocationPercent / 100), 0)
    : 50;

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
  monthly: MonthlyDataPoint[]
): RunwayData {
  const startDate = answers.modelStartDate
    ? new Date(answers.modelStartDate)
    : new Date();

  let breakEvenMonth: number | null = null;
  let cashRunoutMonth: number | null = null;

  for (let i = 0; i < monthly.length; i++) {
    if (breakEvenMonth === null && monthly[i].ebitda >= 0 && i > 0) {
      breakEvenMonth = monthly[i].month;
    }
    if (cashRunoutMonth === null && monthly[i].closingCash <= 0 && i > 0) {
      cashRunoutMonth = monthly[i].month;
    }
  }

  const runwayMonths = cashRunoutMonth ?? MONTHS;
  const runwayDate = new Date(startDate);
  runwayDate.setMonth(runwayDate.getMonth() + runwayMonths);

  const breakEvenYear = breakEvenMonth != null
    ? Math.ceil(breakEvenMonth / 12)
    : null;

  return {
    equityRaise: answers.fundingAsk,
    monthlyBurnAtStart: answers.monthlyBurn,
    runwayMonths,
    runwayEndDate: runwayDate.toISOString().slice(0, 7),
    cashPositive: cashRunoutMonth === null,
    breakEvenMonth,
    breakEvenYear,
  };
}

function buildScenario(
  answers: QuestionnaireAnswers,
  curve: GrowthCurve
): ScenarioMetrics {
  const monthly = computeMonthly(answers, curve);
  const annual = aggregateAnnual(monthly);
  const runway = computeRunway(answers, monthly);
  const lastYear = annual[2];

  return {
    label: curve.charAt(0).toUpperCase() + curve.slice(1),
    revenueY1: annual[0].revenue,
    revenueY2: annual[1].revenue,
    revenueY3: lastYear.revenue,
    ebitdaY3: lastYear.ebitda,
    runwayMonths: runway.runwayMonths,
    totalUsersY3: lastYear.endingUsers,
    arrY3: lastYear.arr,
  };
}

function buildCapTable(answers: QuestionnaireAnswers, annual: AnnualSummary[]): CapTableData {
  const arrY1 = annual[0].arr;
  const revenueMultiple =
    answers.fundingStage === "pre-seed" ? 8
    : answers.fundingStage === "seed" ? 10
    : answers.fundingStage === "series-a" ? 12
    : 15;

  const preMoneyValuation = arrY1 > 0
    ? arrY1 * revenueMultiple
    : answers.fundingAsk * 4;

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

function buildFundingNarrative(
  answers: QuestionnaireAnswers,
  annual: AnnualSummary[],
  runway: RunwayData,
  capTable: CapTableData
): string {
  const company = answers.companyName || "The company";
  const raise = formatCurrency(answers.fundingAsk);
  const stage = answers.fundingStage.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const proceedsText = answers.useOfProceeds.join(", ").toLowerCase();
  const runwayText = runway.cashPositive
    ? "well beyond the 3-year model horizon"
    : `${runway.runwayMonths} months`;
  const breakEvenText = runway.breakEvenYear
    ? `Year ${runway.breakEvenYear}`
    : "within the forecast period";
  const y3Users = annual[2].endingUsers.toLocaleString("en-US");
  const y3Arr = formatCurrency(annual[2].arr);

  return `${company} is raising ${raise} at ${stage}. The raise provides ${runwayText} of runway and funds ${proceedsText}. At target growth, the business reaches EBITDA breakeven in ${breakEvenText} with ${y3Users} paying customers generating ${y3Arr} ARR. Post-raise, new investors receive ${(capTable.newEquityPercent * 100).toFixed(1)}% equity at a ${formatCurrency(capTable.preMoneyValuation)} pre-money valuation.`;
}

function selectModelType(answers: QuestionnaireAnswers): ModelType {
  if (
    answers.businessModel === "saas" ||
    (answers.businessModel === "product" && answers.customerType === "b2b")
  ) {
    return "saas";
  }
  if (
    answers.pricePerUnit != null ||
    answers.constructionCost != null
  ) {
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

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function runFinancialEngine(answers: QuestionnaireAnswers): ModelOutputs {
  const modelType = selectModelType(answers);
  const sourceModel = sourceModelFile(modelType);

  const monthly = computeMonthly(answers, answers.growthCurve);
  const annual = aggregateAnnual(monthly);
  const unitEconomics = computeUnitEconomics(answers, monthly, annual);
  const runway = computeRunway(answers, monthly);
  const capTable = buildCapTable(answers, annual);
  const fundingNarrative = buildFundingNarrative(answers, annual, runway, capTable);

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
    answers,
    monthly,
    annual,
    unitEconomics,
    runway,
    scenarios,
    capTable,
    fundingNarrative,
  };
}
