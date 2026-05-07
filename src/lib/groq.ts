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
}): Promise<string> {
  const client = getClient();
  if (!client) return params.fallbackNarrative;

  const { answers, annual, runway, capTable } = params;
  const company = answers.companyName || "The company";

  const context = `
Business: ${company}
Type: ${answers.businessModel} | Stage: ${answers.fundingStage} | Market: ${answers.geography.toUpperCase()}
Raise: ${fmtCurrency(answers.fundingAsk)} | Use of proceeds: ${answers.useOfProceeds.join(", ")}
Growth scenario: ${answers.growthCurve}

Year 1 Revenue: ${fmtCurrency(annual[0].revenue)} | ARR: ${fmtCurrency(annual[0].arr)} | Customers: ${formatNumber(annual[0].endingUsers)}
Year 2 Revenue: ${fmtCurrency(annual[1].revenue)} | ARR: ${fmtCurrency(annual[1].arr)} | Customers: ${formatNumber(annual[1].endingUsers)}
Year 3 Revenue: ${fmtCurrency(annual[2].revenue)} | ARR: ${fmtCurrency(annual[2].arr)} | Customers: ${formatNumber(annual[2].endingUsers)}
Year 3 EBITDA: ${fmtCurrency(annual[2].ebitda)} | Margin: ${(annual[2].ebitdaMargin * 100).toFixed(1)}%

Runway: ${runway.cashPositive ? "36+ months" : `${runway.runwayMonths} months`}
Break-even: ${runway.breakEvenYear ? `Year ${runway.breakEvenYear}` : "beyond forecast period"}
Pre-money valuation: ${fmtCurrency(capTable.preMoneyValuation)}
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
}): Promise<string[]> {
  const client = getClient();
  if (!client) return [];

  const { answers, annual, runway } = params;

  const context = `
Business: ${answers.businessModel}, ${answers.fundingStage}, CAC=$${answers.cac}
Monthly burn: $${answers.monthlyBurn}, Runway: ${runway.runwayMonths}mo
Y3 Revenue: ${fmtCurrency(annual[2].revenue)}, Y3 EBITDA: ${fmtCurrency(annual[2].ebitda)}
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
  const { answers, annual, runway, unitEconomics, capTable } = model;
  const company = answers.companyName || "the company";
  return `
You are reviewing ${company}'s financial model. Reference these numbers when answering:

INPUTS
- Business: ${answers.businessModel} (${answers.customerType}), ${answers.fundingStage} stage, market ${answers.geography.toUpperCase()}
- Pricing tiers: ${answers.tiers.map((t) => `${t.name}=$${t.monthlyPrice}/mo (${t.allocationPercent}% of users)`).join("; ") || "(default)"}
- CAC: $${answers.cac} | Year-1 user target: ${formatNumber(answers.year1UserTarget)}
- Monthly burn: ${fmtCurrency(answers.monthlyBurn)} | Headcount: ${answers.headcount}
- Funding ask: ${fmtCurrency(answers.fundingAsk)} | Use of proceeds: ${answers.useOfProceeds.join(", ") || "n/a"}
- Growth scenario: ${answers.growthCurve} | Churn: ${answers.churnEstimate}

PROJECTIONS (3 years)
- Revenue: Y1 ${fmtCurrency(annual[0].revenue)} → Y2 ${fmtCurrency(annual[1].revenue)} → Y3 ${fmtCurrency(annual[2].revenue)}
- ARR (year-end): Y1 ${fmtCurrency(annual[0].arr)} → Y2 ${fmtCurrency(annual[1].arr)} → Y3 ${fmtCurrency(annual[2].arr)}
- Gross margin Y3: ${(annual[2].grossMargin * 100).toFixed(1)}% | EBITDA Y3: ${fmtCurrency(annual[2].ebitda)} (${(annual[2].ebitdaMargin * 100).toFixed(1)}%)
- Customers Y3: ${formatNumber(annual[2].endingUsers)}

UNIT ECONOMICS
- Blended ARPU: ${fmtCurrency(Math.round(unitEconomics.blendedArpu))}/mo | LTV: ${fmtCurrency(unitEconomics.ltv)} | LTV/CAC: ${unitEconomics.ltvCacRatio.toFixed(2)}x | Payback: ${unitEconomics.paybackMonths.toFixed(1)} months

RUNWAY
- ${runway.cashPositive ? "Cash positive across the full forecast." : `Runway ${runway.runwayMonths} months from start.`}
- Break-even: ${runway.breakEvenYear ? `Year ${runway.breakEvenYear} (month ${runway.breakEvenMonth})` : "beyond the 3-year forecast"}

CAP TABLE (post-raise)
- Pre-money: ${fmtCurrency(capTable.preMoneyValuation)} | Raise: ${fmtCurrency(capTable.raiseAmount)} | Post-money: ${fmtCurrency(capTable.postMoneyValuation)}
- New investor equity: ${(capTable.newEquityPercent * 100).toFixed(1)}%
  `.trim();
}

export async function chatWithModel(params: {
  model?: ModelOutputs;
  messages: ChatMessage[];
}): Promise<string> {
  const client = getClient();
  if (!client) {
    throw new Error("AI chat is not configured. Set GROQ_API_KEY in environment.");
  }

  const systemPrompt = params.model
    ? `You are an experienced startup CFO and fundraising advisor speaking to the founder. Be direct, concise, and use the founder's actual numbers. Prefer 1–3 short paragraphs unless the user asks for more. If a question asks "what if X", reason from the formulas: revenue depends on customers × ARPU, EBITDA = gross profit − OpEx, runway = cash ÷ net burn, LTV = (ARPU × gross margin) ÷ churn, etc. If the question can't be answered from the data, say so plainly.

${buildModelContext(params.model)}`
    : `You are a friendly startup financial-modelling expert and ModelUp product guide. ModelUp helps founders generate a 3-year financial model from a 10-question intake; Pro is $4.99/mo and unlocks interactive charts, unit economics, scenarios, cap table, calculations panel, AI chat, and an Excel download.

Help the user with:
• Questions about ModelUp — what it does, how to use it, what's free vs Pro.
• General fundraising and financial-model questions — CAC, LTV, runway, dilution, valuations, scenarios.
• Encouraging them to build a model when relevant ("you can answer 10 quick questions and have one in 30 seconds").

Be concise (1–3 short paragraphs). If the question really needs the user's specific numbers and they haven't built a model yet, suggest they build one.`;

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
  fundingStage?: FundingStage;
  growthCurve?: GrowthCurve;
  churnEstimate?: ChurnEstimate;
  companyName?: string;
  monthlyBurn?: number;
  cac?: number;
  year1UserTarget?: number;
  fundingAsk?: number;
  acquisitionChannels?: string[];
  useOfProceeds?: string[];
  tiers?: TierConfig[];
  reasoning?: string;
}

const BUSINESS_MODELS: BusinessModel[] = ["saas", "marketplace", "product", "service", "other"];
const CUSTOMER_TYPES: CustomerType[] = ["b2b", "b2c", "both"];
const GEOGRAPHIES: Geography[] = ["us", "uk", "eu", "asia", "global"];
const FUNDING_STAGES: FundingStage[] = ["pre-seed", "seed", "series-a", "series-b"];
const GROWTH_CURVES: GrowthCurve[] = ["conservative", "base", "aggressive"];
const CHURN_ESTIMATES: ChurnEstimate[] = ["lt2", "2to5", "5to10", "gt10", "unknown"];

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
  return out.length > 0 ? out : undefined;
}

function sanitizeSuggestions(raw: Record<string, unknown>): SuggestedAnswers {
  const cleaned: SuggestedAnswers = {
    businessModel: pick(raw.businessModel, BUSINESS_MODELS),
    customerType: pick(raw.customerType, CUSTOMER_TYPES),
    geography: pick(raw.geography, GEOGRAPHIES),
    fundingStage: pick(raw.fundingStage, FUNDING_STAGES),
    growthCurve: pick(raw.growthCurve, GROWTH_CURVES),
    churnEstimate: pick(raw.churnEstimate, CHURN_ESTIMATES),
    companyName: typeof raw.companyName === "string" ? raw.companyName.slice(0, 80) : undefined,
    monthlyBurn: num(raw.monthlyBurn),
    cac: num(raw.cac),
    year1UserTarget: num(raw.year1UserTarget),
    fundingAsk: num(raw.fundingAsk),
    acquisitionChannels: strArray(raw.acquisitionChannels, 6),
    useOfProceeds: strArray(raw.useOfProceeds, 5),
    tiers: tiersArray(raw.tiers),
    reasoning: typeof raw.reasoning === "string" ? raw.reasoning.slice(0, 280) : undefined,
  };

  // Strip undefined keys for a clean merge on the client.
  return Object.fromEntries(Object.entries(cleaned).filter(([, v]) => v !== undefined)) as SuggestedAnswers;
}

export async function suggestAnswersFromDescription(description: string): Promise<SuggestedAnswers> {
  const client = getClient();
  if (!client) {
    throw new Error("AI suggestions are not configured. Set GROQ_API_KEY in environment.");
  }

  const prompt = `A founder described their startup. Infer reasonable defaults for their financial model.

Founder's description:
"""
${description.trim().slice(0, 1500)}
"""

Return ONLY a JSON object with these optional keys (omit any you can't reasonably infer):

- businessModel: one of "saas" | "marketplace" | "product" | "service" | "other"
- customerType: one of "b2b" | "b2c" | "both"
- geography: one of "us" | "uk" | "eu" | "asia" | "global"
- fundingStage: one of "pre-seed" | "seed" | "series-a" | "series-b"
- growthCurve: one of "conservative" | "base" | "aggressive"
- churnEstimate: one of "lt2" | "2to5" | "5to10" | "gt10" | "unknown"
- companyName: string (only if explicitly mentioned)
- monthlyBurn: integer USD per month (typical pre-seed 8-20k, seed 30-80k, A 150-400k)
- cac: integer USD per customer
- year1UserTarget: integer customers at end of year 1
- fundingAsk: integer USD raised in this round
- acquisitionChannels: subset of ["paid-ads","seo","sales","partnerships","word-of-mouth","product-led"]
- useOfProceeds: subset of ["product-dev","hiring","marketing","operations","working-capital"]
- tiers: array of {name: string, monthlyPrice: number, allocationPercent: number} summing to 100
- reasoning: <= 240 chars on why these defaults make sense

Be realistic. If the description is vague, return only the fields you're confident about.`;

  const response = await client.chat.completions.create({
    model: NARRATIVE_MODEL,
    max_tokens: 700,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a startup financial-modeling assistant. Output strictly a JSON object — no prose, no markdown.",
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
