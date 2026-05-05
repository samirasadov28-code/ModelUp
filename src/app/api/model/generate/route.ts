import { NextRequest, NextResponse } from "next/server";
import { runFinancialEngine } from "@/lib/financial-engine";
import { saveModel } from "@/lib/model-store";
import { saveModelToDb } from "@/lib/supabase";
import { generateFundingNarrative, generateModelInsights } from "@/lib/groq";
import type { QuestionnaireAnswers } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const answers: QuestionnaireAnswers = await req.json();

    if (!answers.businessModel || !answers.fundingAsk || answers.fundingAsk <= 0) {
      return NextResponse.json({ error: "Invalid questionnaire answers" }, { status: 400 });
    }

    // Run the core financial engine
    const outputs = runFinancialEngine(answers);

    // Enhance narrative with Groq AI (falls back to template if no API key)
    const [aiNarrative, aiInsights] = await Promise.all([
      generateFundingNarrative({
        answers,
        annual: outputs.annual,
        runway: outputs.runway,
        capTable: outputs.capTable,
        fallbackNarrative: outputs.fundingNarrative,
      }),
      generateModelInsights({
        answers,
        annual: outputs.annual,
        runway: outputs.runway,
      }),
    ]);

    const enrichedOutputs = {
      ...outputs,
      fundingNarrative: aiNarrative,
      aiInsights,
    };

    // Persist: in-memory (same instance) + Supabase (when configured)
    saveModel(enrichedOutputs);
    await saveModelToDb({
      id: enrichedOutputs.modelId,
      name: answers.companyName ?? `Model ${new Date().toLocaleDateString()}`,
      modelType: enrichedOutputs.modelType,
      sourceModel: enrichedOutputs.sourceModel,
      answers,
      outputs: enrichedOutputs,
    });

    // Return full model so client can persist in localStorage (Netlify-safe)
    return NextResponse.json({
      modelId: enrichedOutputs.modelId,
      modelType: enrichedOutputs.modelType,
      sourceModel: enrichedOutputs.sourceModel,
      outputs: enrichedOutputs,
    });
  } catch (err) {
    console.error("Model generation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
