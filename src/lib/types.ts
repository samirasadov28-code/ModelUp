export type BusinessModel = "saas" | "marketplace" | "product" | "service" | "other";
export type CustomerType = "b2b" | "b2c" | "both";
export type Geography = "us" | "uk" | "eu" | "asia" | "global";
export type FundingStage = "pre-seed" | "seed" | "series-a" | "series-b";
export type GrowthCurve = "conservative" | "base" | "aggressive";
export type ChurnEstimate = "lt2" | "2to5" | "5to10" | "gt10" | "unknown";
export type ModelType = "saas" | "alternative" | "project_finance";
export type SubscriptionStatus = "free" | "trialing" | "active" | "canceled";

export type TaxJurisdiction =
  // Free tier — the four most common defaults.
  | "us" | "uk" | "ireland" | "other"
  // Pro extended — broader coverage for serious global founders.
  | "germany" | "france" | "netherlands" | "spain" | "italy" | "sweden"
  | "switzerland" | "estonia" | "denmark" | "norway"
  | "belgium" | "austria" | "portugal" | "finland" | "luxembourg"
  | "malta" | "cyprus" | "poland" | "czechia"
  | "canada" | "australia" | "new-zealand"
  | "singapore" | "hong-kong" | "japan" | "south-korea" | "india" | "indonesia"
  | "thailand" | "vietnam" | "malaysia" | "philippines" | "taiwan" | "china"
  | "uae" | "saudi-arabia" | "israel" | "turkey" | "egypt"
  | "brazil" | "mexico" | "argentina" | "chile" | "colombia"
  | "south-africa" | "nigeria"
  | "cayman-islands";

export type CurrencyCode =
  | "USD" | "GBP" | "EUR" | "CAD" | "AUD" | "NZD" | "SGD" | "HKD" | "JPY"
  | "KRW" | "INR" | "IDR" | "AED" | "SAR" | "ILS" | "BRL" | "MXN" | "ARS"
  | "ZAR" | "NGN" | "CHF" | "SEK" | "NOK" | "DKK"
  | "PLN" | "CZK" | "CLP" | "COP" | "THB" | "VND" | "MYR" | "PHP" | "TWD"
  | "CNY" | "TRY" | "EGP";

export interface Currency {
  code: CurrencyCode;
  symbol: string;   // "$", "£", "€", "S$", "₹", …
  locale: string;   // "en-US", "en-GB", "de-DE", …
}

export interface TierConfig {
  name: string;
  monthlyPrice: number;
  allocationPercent: number;
}

export type RevenueStreamType =
  | "transaction"   // marketplace fees, % of GMV
  | "service"       // consulting, implementation, retainers
  | "one-time"      // setup fees, hardware, licenses
  | "usage"         // per-API-call, per-event, metered
  | "ads"           // sponsorships, ad inventory
  | "other";

export interface RevenueStream {
  id: string;
  type: RevenueStreamType;
  name: string;
  monthlyRevenue: number;     // expected starting $/month from this stream
  scalesWithUsers: boolean;   // if true, grows proportionally with the customer base
}

/**
 * How the business primarily makes money. Subscription is the default and uses
 * the tier-based engine (price × allocation × customer base). Production uses
 * unit economics (units × unit price). Hybrid runs both and adds them.
 */
export type RevenueModel = "subscription" | "production" | "hybrid";

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
  revenueModel?: RevenueModel; // defaults to "subscription"
  tiers: TierConfig[];
  takeRate?: number;
  revenueStreams?: RevenueStream[];
  // Production / unit-based revenue (used when revenueModel is "production" or "hybrid")
  unitsYear1?: number;            // units sold in year 1
  unitPrice?: number;             // price per unit
  unitCost?: number;              // direct cost per unit (raw materials + direct labor)
  unitMonthlyVolumeGrowth?: number; // 0.05 = +5% units per month
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
  // Where the company is incorporated for corporate tax purposes.
  // Defaults to whatever maps cleanly from `geography` if not supplied.
  taxJurisdiction?: TaxJurisdiction;
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
  // Per-year revenue + ARR + customer count + EBITDA. Engines that target the
  // 5-year horizon should fill Y1..Y5; older models filled Y1..Y3. Components
  // should rely on `revenueLast`, `ebitdaLast`, `arrLast`, `totalUsersLast`
  // (= the last forecast year) instead of hardcoded Y3 fields.
  revenueY1: number;
  revenueY2: number;
  revenueY3: number;
  revenueY5?: number;
  ebitdaY3: number;
  ebitdaY5?: number;
  runwayMonths: number;
  totalUsersY3: number;
  totalUsersY5?: number;
  arrY3: number;
  arrY5?: number;
  revenueLast: number;     // last forecast year — alias for whichever Yn is the horizon
  ebitdaLast: number;
  totalUsersLast: number;
  arrLast: number;
}

export interface CostComponent {
  /** Display name shown to the user, e.g. "Hosting", "Salaries", "Payroll taxes & benefits". */
  label: string;
  /** Either an absolute monthly amount or null when the engine prefers % below. */
  monthlyAmount: number;
  /** Optional — what the line is a % of (revenue for COGS, burn for OpEx). */
  share: number;
  /** Optional explanation surfaced in the calculations panel. */
  note?: string;
}

export interface CostBreakdown {
  /**
   * Direct-cost components that sum to the engine's COGS line. Varies by
   * business model — SaaS gets hosting + payment processing + support;
   * marketplace gets payment processing + insurance + ops; product gets
   * unit cost + shipping + fulfillment; production gets materials + labor.
   */
  cogsComponents: CostComponent[];
  /** Engine's COGS rate (or 0 for production where COGS is per-unit). */
  cogsRate: number;
  /**
   * OpEx breakdown — the user's all-in monthly burn split into salaries,
   * payroll-loading uplift (region-specific NI/FICA/etc.), tools, marketing,
   * and a residual "other" bucket so the math actually adds up.
   */
  opexComponents: CostComponent[];
  payrollLoadingRate: number;   // e.g. 0.138 for UK, 0.20 for Germany, 0.0765 for US
  payrollLoadingLabel: string;  // e.g. "UK National Insurance (13.8%)"
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
  currency: Currency;
  taxRate: number;
  costBreakdown: CostBreakdown;
  horizonMonths: number;   // 36 or 60 — the actual model horizon
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
