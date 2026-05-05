import { NextRequest, NextResponse } from "next/server";
import { suggestAnswersFromDescription } from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { description } = (await req.json()) as { description?: string };
    if (!description || typeof description !== "string" || description.trim().length < 10) {
      return NextResponse.json(
        { error: "Please describe your startup in at least one sentence." },
        { status: 400 }
      );
    }

    const suggestions = await suggestAnswersFromDescription(description);
    return NextResponse.json({ suggestions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Suggestion request failed";
    const isMissingKey = /not configured/i.test(message);
    return NextResponse.json(
      { error: message },
      { status: isMissingKey ? 503 : 500 }
    );
  }
}
