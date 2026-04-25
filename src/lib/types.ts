export type BusinessModel = "saas" | "marketplace" | "product" | "service" | "other";
export type CustomerType = "b2b" | "b2c" | "both";
export type Geography = "us" | "uk" | "eu" | "asia" | "global";
export type FundingStage = "pre-seed" | "seed" | "series-a" | "series-b";
export type GrowthCurve = "conservative" | "base" | "aggressive";
export type ChurnEstimate = "lt2" | "2to5" | "5to10" | "gt10" | "unknown";
export type ModelType = "saas" | "alternative" | "project_finance";
export type SubscriptionStatus = "free" | "trialing" | "active" | "canceled";

export interface TierConfig {
  name: string;
  monthlyPrice: number;
  allocationPercent: number;
}

export interface QuestionnaireAnswers {
  // Q1
  businessModel: BusinessModel;
  // Q2
  customerType: CustomerType;
  // Q3
  geography: Geography;
  // Q4
  fundingStage: FundingStage;
  // Q5
  pricingModel?: string;
  tiers: TierConfig[];
  takeRate?: number;
  // Q6
  acquisitionChannels: string[];
  cac: number;
  acv?: number;
  avgMonthlySpend?: number;
  // Q7
  churnEstimate: ChurnEstimate;
  monthlyChurnRate: number;
  // Q8
  headcount: string;
  monthlyBurn: number;
  // Q9
  year1UserTarget: number;
  growthCurve: GrowthCurve;
  // Q10
  fundingAsk: number;
  useOfProceeds: string[];
  targetRunway: 12 | 18 | 24 | 36;
  // Optional PF-specific
  pricePerUnit?: number;
  constructionCost?: number;
  debtEquitySplit?: number;
  // Derived
  companyName?: string;
  modelStartDate?: string;
}

// ── Financial Engine Output Types ──────────────────────────────────────────

export interface MonthlyDataPoint {
  month: number;
  label: string;
  totalUsers: number;
  newUsers: number;
  churnedUsers: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  opex: number;
  ebitda: number;
  tax: number;
  netIncome: number;
  openingCash: number;
  closingCash: number;
  tierBreakdown: { name: string; users: number; revenue: number }[];
}

export interface AnnualSummary {
  year: number;
  label: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  opex: number;
  ebitda: number;
  ebitdaMargin: number;
  netIncome: number;
  endingUsers: number;
  arr: number;
}

export interface UnitEconomics {
  blendedArpu: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  paybackMonths: number;
  grossMarginRate: number;
  cacStatus: "green" | "amber" | "red";
}

export interface RunwayData {
  equityRaise: number;
  monthlyBurnAtStart: number;
  runwayMonths: number;
  runwayEndDate: string;
  cashPositive: boolean;
  breakEvenMonth: number | null;
  breakEvenYear: number | null;
}

export interface ScenarioMetrics {
  label: string;
  revenueY1: number;
  revenueY2: number;
  revenueY3: number;
  ebitdaY3: number;
  runwayMonths: number;
  totalUsersY3: number;
  arrY3: number;
}

export interface CapTableEntry {
  shareholder: string;
  sharesPreRaise: number;
  sharesPostRaise: number;
  ownershipPreRaise: number;
  ownershipPostRaise: number;
}

export interface CapTableData {
  entries: CapTableEntry[];
  preMoneyValuation: number;
  postMoneyValuation: number;
  raiseAmount: number;
  newEquityPercent: number;
  pricePerShare: number;
}

export interface ModelOutputs {
  modelId: string;
  modelType: ModelType;
  sourceModel: string;
  createdAt: string;
  answers: QuestionnaireAnswers;
  monthly: MonthlyDataPoint[];
  annual: AnnualSummary[];
  unitEconomics: UnitEconomics;
  runway: RunwayData;
  scenarios: {
    base: ScenarioMetrics;
    conservative: ScenarioMetrics;
    aggressive: ScenarioMetrics;
  };
  capTable: CapTableData;
  fundingNarrative: string;
}

// ── UI/Page types ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate?: string;
  trialEnd?: string;
}

export interface SavedModel {
  id: string;
  name: string;
  modelType: ModelType;
  createdAt: string;
  outputs?: ModelOutputs;
}
