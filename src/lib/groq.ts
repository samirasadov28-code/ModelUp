/**
 * Groq API client — OpenAI-compatible endpoint at https://api.groq.com.
 * Powers the funding narrative, AI insights, and the in-app chat.
 *
 * Auth: GROQ_API_KEY (with GROK_API_KEY accepted as a legacy fallback so older
 * deployments don't break on rename).
 */

import OpenAI from "openai";
import type {
  AnnualSummary,
  RunwayData,
  CapTableData,
  QuestionnaireAnswers,
  ModelOutputs,
  BusinessModel,
  CustomerType,
  Geography,
  FundingStage,
  GrowthCurve,
  ChurnEstimate,
  TierConfig,
  RevenueStream,
  RevenueStreamType,
  TaxJurisdiction,
} from "./types";
import { formatCurrencyCompact, formatNumber } from "./utils";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const NARRATIVE_MODEL = "llama-3.3-70b-versatile";
const INSIGHTS_MODEL = "llama-3.3-70b-versatile";
const CHAT_MODEL = "llama-3.3-70b-versatile";

let _client: OpenAI | null = null;

function getApiKey(): string | undefined {
  return process.env.GROQ_API_KEY ?? process.env.GROK_API_KEY;
}

function getClient(): OpenAI | null {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  if (!_client) {
    _client = new OpenAI({ apiKey, baseURL: GROQ_BASE_URL });
  }
  return _client;
}

const fmtCurrency = formatCurrencyCompact;

export async function generateFundingNarrative(params: {
  answers: QuestionnaireAnswers;
  annual: AnnualSummary[];
  runway: RunwayData;
  capTable: CapTableData;
  fallbackNarrative: string;
  currency?: import("./types").Currency;
}): Promise<string> {
  const client = getClient();
  if (!client) return params.fallbackNarrative;

  const { answers, annual, runway, capTable, currency } = params;
  const company = answers.companyName || "The company";
  const c = (v: number) => fmtCurrency(v, currency);
  const code = currency?.code ?? "USD";

  const context = `
Business: ${company}
Type: ${answers.businessModel} | Stage: ${answers.fundingStage} | Market: ${answers.geography.toUpperCase()} | Tax base: ${(answers.taxJurisdiction ?? "us").toUpperCase()}
Reporting currency: ${code} (use this in the narrative)
Raise: ${c(answers.fundingAsk)} | Use of proceeds: ${answers.useOfProceeds.join(", ")}
Growth scenario: ${answers.growthCurve}

Year 1 Revenue: ${c(annual[0].revenue)} | ARR: ${c(annual[0].arr)} | Customers: ${formatNumber(annual[0].endingUsers)}
Year 2 Revenue: ${c(annual[1].revenue)} | ARR: ${c(annual[1].arr)} | Customers: ${formatNumber(annual[1].endingUsers)}
Year 3 Revenue: ${c(annual[2].revenue)} | ARR: ${c(annual[2].arr)} | Customers: ${formatNumber(annual[2].endingUsers)}
Year 3 EBITDA: ${c(annual[2].ebitda)} | Margin: ${(annual[2].ebitdaMargin * 100).toFixed(1)}%

Runway: ${runway.cashPositive ? "36+ months" : `${runway.runwayMonths} months`}
Break-even: ${runway.breakEvenYear ? `Year ${runway.breakEvenYear}` : "beyond forecast period"}
Pre-money valuation: ${c(capTable.preMoneyValuation)}
Investor equity: ${(capTable.newEquityPercent * 100).toFixed(1)}%
  `.trim();

  try {
    const response = await client.chat.completions.create({
      model: NARRATIVE_MODEL,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content:
            "You are a senior financial advisor writing crisp investor-facing pitch language. Write exactly one paragraph (3–4 sentences). Use precise numbers from the data. Sound confident and professional — like a Goldman Sachs analyst, not a startup blogger. No preamble, no labels, just the paragraph.",
        },
        {
          role: "user",
          content: `Write a funding ask narrative paragraph for this startup:\n\n${context}`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim();
    return text || params.fallbackNarrative;
  } catch (err) {
    console.error("Groq narrative generation failed:", err);
    return params.fallbackNarrative;
  }
}

export async function generateModelInsights(params: {
  answers: QuestionnaireAnswers;
  annual: AnnualSummary[];
  runway: RunwayData;
  currency?: import("./types").Currency;
}): Promise<string[]> {
  const client = getClient();
  if (!client) return [];

  const { answers, annual, runway, currency } = params;
  const sym = currency?.symbol ?? "$";

  const context = `
Business: ${answers.businessModel}, ${answers.fundingStage}, CAC=${sym}${answers.cac}
Tax base: ${(answers.taxJurisdiction ?? "us").toUpperCase()}
Monthly burn: ${sym}${answers.monthlyBurn}, Runway: ${runway.runwayMonths}mo
Y3 Revenue: ${fmtCurrency(annual[2].revenue, currency)}, Y3 EBITDA: ${fmtCurrency(annual[2].ebitda, currency)}
Churn: ${answers.monthlyChurnRate}%/mo, Growth: ${answers.growthCurve}
  `.trim();

  try {
    const response = await client.chat.completions.create({
      model: INSIGHTS_MODEL,
      max_tokens: 320,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'You are a startup CFO. Return JSON of the shape {"insights": ["...","...","..."]} with exactly 3 short, sharp financial insights. Each insight is one sentence focused on risk, opportunity, or investor concern.',
        },
        {
          role: "user",
          content: `Insights for this model:\n\n${context}`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed) ? parsed : parsed?.insights;
    return Array.isArray(list) ? list.slice(0, 3) : [];
  } catch {
    return [];
  }
}

// ── Chat ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

function buildModelContext(model: ModelOutputs): string {
  const { answers, annual, runway, unitEconomics, capTable, currency, taxRate } = model;
  const company = answers.companyName || "the company";
  const c = (v: number) => fmtCurrency(v, currency);
  return `
You are reviewing ${company}'s financial model. Reference these numbers when answering. ALL CURRENCY IS IN ${currency.code} (${currency.symbol}). Quote figures in ${currency.code}.

INPUTS
- Business: ${answers.businessModel} (${answers.customerType}), ${answers.fundingStage} stage, market ${answers.geography.toUpperCase()}, tax base ${(answers.taxJurisdiction ?? "us").toUpperCase()} (corporate tax ${(taxRate * 100).toFixed(1)}%)
- Pricing tiers: ${answers.tiers.map((t) => `${t.name}=${currency.symbol}${t.monthlyPrice}/mo (${t.allocationPercent}% of users)`).join("; ") || "(default)"}
- Other revenue streams: ${
    answers.revenueStreams && answers.revenueStreams.length > 0
      ? answers.revenueStreams.map((s) => `${s.name || s.type} (${s.type}, ${currency.symbol}${formatNumber(s.monthlyRevenue)}/mo${s.scalesWithUsers ? ", scales w/ users" : ", flat"})`).join("; ")
      : "none"
  }
- CAC: ${c(answers.cac)} | Year-1 user target: ${formatNumber(answers.year1UserTarget)}
- Monthly burn: ${c(answers.monthlyBurn)} | Headcount: ${answers.headcount}
- Funding ask: ${c(answers.fundingAsk)} | Use of proceeds: ${answers.useOfProceeds.join(", ") || "n/a"}
- Growth scenario: ${answers.growthCurve} | Churn: ${answers.churnEstimate}

PROJECTIONS (${annual.length} years)
- Revenue: Y1 ${c(annual[0].revenue)} → Y2 ${c(annual[1].revenue)} → Y3 ${c(annual[2].revenue)}
- ARR (year-end): Y1 ${c(annual[0].arr)} → Y2 ${c(annual[1].arr)} → Y3 ${c(annual[2].arr)}
- Gross margin Y3: ${(annual[2].grossMargin * 100).toFixed(1)}% | EBITDA Y3: ${c(annual[2].ebitda)} (${(annual[2].ebitdaMargin * 100).toFixed(1)}%)
- Customers Y3: ${formatNumber(annual[2].endingUsers)}

UNIT ECONOMICS
- Blended ARPU: ${c(Math.round(unitEconomics.blendedArpu))}/mo | LTV: ${c(unitEconomics.ltv)} | LTV/CAC: ${unitEconomics.ltvCacRatio.toFixed(2)}x | Payback: ${unitEconomics.paybackMonths.toFixed(1)} months

RUNWAY
- ${runway.cashPositive ? "Cash positive across the full forecast." : `Runway ${runway.runwayMonths} months from start.`}
- Break-even: ${runway.breakEvenYear ? `Year ${runway.breakEvenYear} (month ${runway.breakEvenMonth})` : `beyond the ${annual.length}-year forecast`}

CAP TABLE (post-raise)
- Pre-money: ${c(capTable.preMoneyValuation)} | Raise: ${c(capTable.raiseAmount)} | Post-money: ${c(capTable.postMoneyValuation)}
- New investor equity: ${(capTable.newEquityPercent * 100).toFixed(1)}%
  `.trim();
}

const LOCALE_LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  it: "Italian",
  nl: "Dutch",
  tr: "Turkish",
  uk: "Ukrainian",
  ru: "Russian",
  ar: "Arabic",
  hi: "Hindi",
  bn: "Bengali",
  zh: "Chinese (Simplified)",
  ja: "Japanese",
  id: "Indonesian",
};

function localeInstruction(locale: string | undefined): string {
  if (!locale || locale === "en") return "";
  const name = LOCALE_LANGUAGE_NAMES[locale] ?? locale;
  return ` Respond in ${name}. Keep technical/financial acronyms (CAC, LTV, EBITDA, WACC, ARR, MRR, SaaS) in English.`;
}

export async function chatWithModel(params: {
  model?: ModelOutputs;
  messages: ChatMessage[];
  locale?: string;
}): Promise<string> {
  const client = getClient();
  if (!client) {
    throw new Error("AI chat is not configured. Set GROQ_API_KEY in environment.");
  }

  const langSuffix = localeInstruction(params.locale);

  const systemPrompt = params.model
    ? `You are an experienced startup CFO and fundraising advisor speaking to the founder. Be direct, concise, and use the founder's actual numbers. Prefer 1–3 short paragraphs unless the user asks for more. If a question asks "what if X", reason from the formulas: revenue depends on customers × ARPU, EBITDA = gross profit − OpEx, runway = cash ÷ net burn, LTV = (ARPU × gross margin) ÷ churn, etc. If the question can't be answered from the data, say so plainly.${langSuffix}

${buildModelContext(params.model)}`
    : `You are a friendly startup financial-modelling expert and ModelUp product guide. ModelUp helps founders generate a 5-year financial model from a 10-question intake; Pro is $4.99/mo and unlocks interactive charts, unit economics, scenarios, cap table, calculations panel, AI chat, and an Excel download.

Help the user with:
• Questions about ModelUp — what it does, how to use it, what's free vs Pro.
• General fundraising and financial-model questions — CAC, LTV, runway, dilution, valuations, scenarios.
• Encouraging them to build a model when relevant ("you can answer 10 quick questions and have one in 30 seconds").

Be concise (1–3 short paragraphs). If the question really needs the user's specific numbers and they haven't built a model yet, suggest they build one.${langSuffix}`;

  const response = await client.chat.completions.create({
    model: CHAT_MODEL,
    max_tokens: 700,
    temperature: 0.4,
    messages: [
      { role: "system", content: systemPrompt },
      ...params.messages.filter((m) => m.role !== "system"),
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

// ── Suggested answers from a free-form startup description ─────────────────

export interface SuggestedAnswers {
  businessModel?: BusinessModel;
  customerType?: CustomerType;
  geography?: Geography;
  taxJurisdiction?: TaxJurisdiction;
  fundingStage?: FundingStage;
  growthCurve?: GrowthCurve;
  churnEstimate?: ChurnEstimate;
  companyName?: string;
  monthlyBurn?: number;
  cac?: number;
  acv?: number;
  avgMonthlySpend?: number;
  year1UserTarget?: number;
  fundingAsk?: number;
  headcount?: string;
  targetRunway?: 12 | 18 | 24 | 36;
  acquisitionChannels?: string[];
  useOfProceeds?: string[];
  tiers?: TierConfig[];
  revenueStreams?: RevenueStream[];
  revenueModel?: "subscription" | "production" | "hybrid";
  unitsYear1?: number;
  unitPrice?: number;
  unitCost?: number;
  unitMonthlyVolumeGrowth?: number;
  reasoning?: string;
}

const BUSINESS_MODELS: BusinessModel[] = ["saas", "marketplace", "product", "service", "other"];
const CUSTOMER_TYPES: CustomerType[] = ["b2b", "b2c", "both"];
const GEOGRAPHIES: Geography[] = ["us", "uk", "eu", "asia", "global"];
const FUNDING_STAGES: FundingStage[] = ["pre-seed", "seed", "series-a", "series-b"];
const GROWTH_CURVES: GrowthCurve[] = ["conservative", "base", "aggressive"];
const CHURN_ESTIMATES: ChurnEstimate[] = ["none", "lt2", "2to5", "5to10", "gt10", "unknown"];
const TAX_JURISDICTIONS: TaxJurisdiction[] = [
  "us", "uk", "ireland", "other",
  "germany", "france", "netherlands", "spain", "italy", "sweden",
  "switzerland", "estonia", "denmark", "norway",
  "belgium", "austria", "portugal", "finland", "luxembourg",
  "malta", "cyprus", "poland", "czechia",
  "canada", "australia", "new-zealand",
  "singapore", "hong-kong", "japan", "south-korea", "india", "indonesia",
  "thailand", "vietnam", "malaysia", "philippines", "taiwan", "china",
  "uae", "saudi-arabia", "israel", "turkey", "egypt",
  "brazil", "mexico", "argentina", "chile", "colombia",
  "south-africa", "nigeria",
  "cayman-islands",
];
const HEADCOUNTS = ["1", "2–5", "6–15", "15+"] as const;
const TARGET_RUNWAYS = [12, 18, 24, 36] as const;
const REVENUE_STREAM_TYPES: RevenueStreamType[] = [
  "transaction",
  "service",
  "one-time",
  "usage",
  "ads",
  "other",
];

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return Math.round(value);
  if (typeof value === "string") {
    const cleaned = Number(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(cleaned) && cleaned >= 0 ? Math.round(cleaned) : undefined;
  }
  return undefined;
}

function strArray(value: unknown, max = 6): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())
    .slice(0, max);
  return filtered.length > 0 ? filtered : undefined;
}

function tiersArray(value: unknown): TierConfig[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: TierConfig[] = [];
  for (const t of value) {
    if (!t || typeof t !== "object") continue;
    const name = typeof (t as { name?: unknown }).name === "string" ? (t as { name: string }).name : undefined;
    const monthlyPrice = num((t as { monthlyPrice?: unknown }).monthlyPrice);
    const allocationPercent = num((t as { allocationPercent?: unknown }).allocationPercent);
    if (name && monthlyPrice != null && allocationPercent != null) {
      out.push({ name, monthlyPrice, allocationPercent: Math.min(100, allocationPercent) });
    }
    if (out.length >= 4) break;
  }
  // Normalise allocations to 100 if close.
  if (out.length > 0) {
    const total = out.reduce((s, t) => s + t.allocationPercent, 0);
    if (total > 0 && Math.abs(total - 100) > 1) {
      const scale = 100 / total;
      out.forEach((t) => (t.allocationPercent = Math.round(t.allocationPercent * scale)));
    }
  }
  return out.length > 0 ? out : undefined;
}

function revenueStreamsArray(value: unknown): RevenueStream[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: RevenueStream[] = [];
  for (const s of value) {
    if (!s || typeof s !== "object") continue;
    const obj = s as Record<string, unknown>;
    const type = pick(obj.type, REVENUE_STREAM_TYPES);
    const name = typeof obj.name === "string" ? obj.name.slice(0, 60) : undefined;
    const monthlyRevenue = num(obj.monthlyRevenue);
    const scalesWithUsers = obj.scalesWithUsers === true || obj.scalesWithUsers === "true";
    if (type && name && monthlyRevenue != null) {
      out.push({
        id: `s_${out.length}_${Date.now()}`,
        type,
        name,
        monthlyRevenue,
        scalesWithUsers,
      });
    }
    if (out.length >= 4) break;
  }
  return out.length > 0 ? out : undefined;
}

function sanitizeSuggestions(raw: Record<string, unknown>): SuggestedAnswers {
  const headcount = pick(raw.headcount, HEADCOUNTS);
  const targetRunwayNum = num(raw.targetRunway);
  const targetRunway =
    targetRunwayNum != null && (TARGET_RUNWAYS as readonly number[]).includes(targetRunwayNum)
      ? (targetRunwayNum as 12 | 18 | 24 | 36)
      : undefined;

  const cleaned: SuggestedAnswers = {
    businessModel: pick(raw.businessModel, BUSINESS_MODELS),
    customerType: pick(raw.customerType, CUSTOMER_TYPES),
    geography: pick(raw.geography, GEOGRAPHIES),
    taxJurisdiction: pick(raw.taxJurisdiction, TAX_JURISDICTIONS),
    fundingStage: pick(raw.fundingStage, FUNDING_STAGES),
    growthCurve: pick(raw.growthCurve, GROWTH_CURVES),
    churnEstimate: pick(raw.churnEstimate, CHURN_ESTIMATES),
    companyName: typeof raw.companyName === "string" ? raw.companyName.slice(0, 80) : undefined,
    monthlyBurn: num(raw.monthlyBurn),
    cac: num(raw.cac),
    acv: num(raw.acv),
    avgMonthlySpend: num(raw.avgMonthlySpend),
    year1UserTarget: num(raw.year1UserTarget),
    fundingAsk: num(raw.fundingAsk),
    headcount,
    targetRunway,
    acquisitionChannels: strArray(raw.acquisitionChannels, 6),
    useOfProceeds: strArray(raw.useOfProceeds, 5),
    tiers: tiersArray(raw.tiers),
    revenueStreams: revenueStreamsArray(raw.revenueStreams),
    revenueModel: pick(raw.revenueModel, ["subscription", "production", "hybrid"] as const),
    unitsYear1: num(raw.unitsYear1),
    unitPrice: num(raw.unitPrice),
    unitCost: num(raw.unitCost),
    unitMonthlyVolumeGrowth: (() => {
      const v = num(raw.unitMonthlyVolumeGrowth);
      if (v == null) return undefined;
      // Accept both 0.05 and 5 (% form) — normalise to decimal.
      return v > 1 ? v / 100 : v;
    })(),
    reasoning: typeof raw.reasoning === "string" ? raw.reasoning.slice(0, 320) : undefined,
  };

  // Strip undefined keys for a clean merge on the client.
  return Object.fromEntries(Object.entries(cleaned).filter(([, v]) => v !== undefined)) as SuggestedAnswers;
}

export async function suggestAnswersFromDescription(description: string): Promise<SuggestedAnswers> {
  const client = getClient();
  if (!client) {
    throw new Error("AI suggestions are not configured. Set GROQ_API_KEY in environment.");
  }

  const prompt = `A founder described their startup below. Read it carefully and infer realistic, industry-appropriate defaults for EVERY question in our 10-step financial-model intake.

Founder's description:
"""
${description.trim().slice(0, 1500)}
"""

Return ONLY a JSON object with these keys. Try to fill EVERY field — only omit a field if the description gives zero signal and no industry default applies. Use industry knowledge to vary defaults: a B2B enterprise SaaS has very different CAC, churn, ACV, pricing, and burn than a consumer mobile app or a marketplace.

REQUIRED — pick one of the listed values:
- businessModel: "saas" | "marketplace" | "product" | "service" | "other"
- customerType:  "b2b" | "b2c" | "both"
- geography:     "us" | "uk" | "eu" | "asia" | "global"   (PRIMARY MARKET — where customers live)
- taxJurisdiction: one of the 50 supported tax bases — pick the one the company is incorporated in for corporate tax purposes. Drives the tax line and valuation multiple. Options:
   "us" | "uk" | "ireland" | "other"
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
   | "cayman-islands"
   Defaults: US founders → "us"; UK founders → "uk"; EU SaaS → "ireland"; Singapore-based APAC → "singapore"; India team → "india"; LATAM → "mexico" or "brazil" by market; MENA → "uae" or "saudi-arabia". Use "cayman-islands" only if explicitly mentioned (typical for offshore fund structures).
- fundingStage:  "pre-seed" | "seed" | "series-a" | "series-b"
- growthCurve:   "conservative" | "base" | "aggressive"   (consumer-viral or PLG → aggressive; enterprise sales-led → base/conservative)
- churnEstimate: "lt2" | "2to5" | "5to10" | "gt10" | "unknown"   (enterprise SaaS lt2/2to5; SMB SaaS 2to5/5to10; consumer 5to10/gt10)
- headcount:     "1" | "2–5" | "6–15" | "15+"  (pre-seed usually 1 or 2–5; seed 2–5 or 6–15; A 6–15 or 15+)
- targetRunway:  12 | 18 | 24 | 36  (most seed rounds aim for 18–24 months)

NUMBERS — give a concrete integer:
- monthlyBurn:     pre-seed $8–20k, seed $30–80k, series-a $150–400k, series-b $400k+. Adjust by headcount.
- cac:             B2B enterprise $1,000–10,000+; B2B SMB $200–800; B2C $20–80; marketplace $5–40.
- acv:             B2B only — annual contract value (ACV = monthlyPrice × 12 × seats × tier-mix). Omit for pure B2C.
- avgMonthlySpend: B2C only — typical consumer spend per month. Omit for pure B2B.
- year1UserTarget: realistic year-1 ending customers. Enterprise B2B 20–200; SMB B2B 200–2,000; B2C 5,000–100,000+; marketplace mid range.
- fundingAsk:      pre-seed $250k–$1M; seed $1–4M; series-a $8–20M; series-b $20–60M.

LISTS:
- acquisitionChannels: subset of ["paid-ads","seo","sales","partnerships","word-of-mouth","product-led"]. Pick what FITS the business — e.g. enterprise SaaS = ["sales","partnerships"]; PLG SaaS = ["product-led","seo","word-of-mouth"]; consumer = ["paid-ads","seo","word-of-mouth"]; marketplace = ["seo","paid-ads","partnerships"].
- useOfProceeds: subset of ["product-dev","hiring","marketing","operations","working-capital"]. Most early-stage rounds include "product-dev" + "hiring"; growth rounds add "marketing".

REVENUE MODEL — decide first, then fill the matching pricing fields:
- revenueModel: "subscription" | "production" | "hybrid"
   • subscription — software, SaaS, consumer apps, marketplaces with recurring fees. Use tiers.
   • production — anything sold as discrete units: hardware, manufactured goods, batched B2B sales, energy/MWh, per-event services. Use unitsYear1 / unitPrice / unitCost / unitMonthlyVolumeGrowth.
   • hybrid — businesses that do both (e.g. SaaS + hardware).
- unitsYear1: integer total units sold in year 1 (omit for pure subscription).
- unitPrice: integer price per unit in the founder's currency.
- unitCost: integer direct cost per unit (raw materials + direct labor).
- unitMonthlyVolumeGrowth: decimal between 0 and 0.5 (5%/mo = 0.05). Omit if unsure — engine defaults to the growth scenario rate.

PRICING — return tiers AND optional revenueStreams:
- tiers: 1–4 objects {name, monthlyPrice, allocationPercent} summing to 100. Tier names should be specific to the business if hinted (e.g. "Solo / Team / Business / Enterprise" for SaaS, "Free / Plus / Pro" for consumer). Adjust prices by customer type — enterprise tiers can be $500–$5,000+/mo per seat.
- revenueStreams: optional 0–4 objects {type, name, monthlyRevenue, scalesWithUsers}. Use this when the description hints at non-subscription revenue: marketplaces should add a "transaction" stream, agencies a "service" stream, hardware companies a "one-time" stream, ad-supported apps an "ads" stream, API products a "usage" stream. Estimate a reasonable starting monthlyRevenue and set scalesWithUsers true if it grows with the customer base.

CONTEXT FIELDS:
- companyName: only if explicitly mentioned by name in the description.
- reasoning:   <= 280 chars explaining the 2–3 most important inferences you made (e.g. "Enterprise B2B → high CAC ($2.5k), low churn (lt2), 15+ seats × $400/mo tier, sales-led GTM, 24-month runway target.")

Output strictly a JSON object. No prose, no markdown.`;

  const response = await client.chat.completions.create({
    model: NARRATIVE_MODEL,
    max_tokens: 1400,
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a startup financial-modeling assistant with deep knowledge of SaaS, marketplaces, consumer apps, agencies, hardware, and project finance unit economics. You translate a one-sentence pitch into concrete, industry-appropriate model defaults across pricing tiers, revenue streams, CAC, churn, burn, headcount, and fundraising. Output strictly a JSON object — no prose, no markdown.",
      },
      { role: "user", content: prompt },
    ],
  });

  const text = response.choices[0]?.message?.content?.trim() ?? "{}";
  const parsed = JSON.parse(text);
  return sanitizeSuggestions(parsed && typeof parsed === "object" ? parsed : {});
}

// ── Backwards-compat aliases ────────────────────────────────────────────────
// The pre-rename names are kept so existing imports don't break.
export const generateNarrativeWithGrok = generateFundingNarrative;
export const generateInsightsWithGrok = generateModelInsights;
