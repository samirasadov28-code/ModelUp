import { NextRequest, NextResponse } from "next/server";
import { chatWithModel, type ChatMessage } from "@/lib/groq";
import type { ModelOutputs } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      model?: ModelOutputs;
      messages?: ChatMessage[];
    };

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "messages are required" }, { status: 400 });
    }

    const trimmed = body.messages
      .filter((m) => m && typeof m.content === "string" && m.content.trim().length > 0)
      .slice(-12);

    if (trimmed.length === 0) {
      return NextResponse.json({ error: "messages were empty after sanitisation" }, { status: 400 });
    }

    const reply = await chatWithModel({ model: body.model, messages: trimmed });
    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat request failed";
    const isMissingKey = /not configured/i.test(message);
    return NextResponse.json(
      { error: message },
      { status: isMissingKey ? 503 : 500 }
    );
  }
}
