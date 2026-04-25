/**
 * Grok (xAI) API client — OpenAI-compatible endpoint.
 * Used for AI-powered funding narrative generation.
 */

import OpenAI from "openai";
import type { AnnualSummary, RunwayData, CapTableData, QuestionnaireAnswers } from "./types";

let _client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!process.env.GROK_API_KEY) return null;
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.GROK_API_KEY,
      baseURL: "https://api.x.ai/v1",
    });
  }
  return _client;
}

function fmtCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

export async function generateNarrativeWithGrok(params: {
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

Year 1 Revenue: ${fmtCurrency(annual[0].revenue)} | ARR: ${fmtCurrency(annual[0].arr)} | Customers: ${annual[0].endingUsers.toLocaleString()}
Year 2 Revenue: ${fmtCurrency(annual[1].revenue)} | ARR: ${fmtCurrency(annual[1].arr)} | Customers: ${annual[1].endingUsers.toLocaleString()}
Year 3 Revenue: ${fmtCurrency(annual[2].revenue)} | ARR: ${fmtCurrency(annual[2].arr)} | Customers: ${annual[2].endingUsers.toLocaleString()}
Year 3 EBITDA: ${fmtCurrency(annual[2].ebitda)} | Margin: ${(annual[2].ebitdaMargin * 100).toFixed(1)}%

Runway: ${runway.cashPositive ? "36+ months" : `${runway.runwayMonths} months`}
Break-even: ${runway.breakEvenYear ? `Year ${runway.breakEvenYear}` : "beyond forecast period"}
Pre-money valuation: ${fmtCurrency(capTable.preMoneyValuation)}
Investor equity: ${(capTable.newEquityPercent * 100).toFixed(1)}%
  `.trim();

  try {
    const response = await client.chat.completions.create({
      model: "grok-3-mini",
      max_tokens: 200,
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
    console.error("Grok narrative generation failed:", err);
    return params.fallbackNarrative;
  }
}

export async function generateInsightsWithGrok(params: {
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
      model: "grok-3-mini",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "You are a startup CFO. Return exactly 3 short, sharp financial insights as a JSON array of strings. Each insight is one sentence. Focus on risk, opportunity, or investor concern. Return only valid JSON array, nothing else.",
        },
        {
          role: "user",
          content: `Insights for this model:\n\n${context}`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim() ?? "[]";
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch {
    return [];
  }
}
