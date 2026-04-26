import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { message, email, rating, page_url } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const db = getSupabase();

    if (db) {
      const { error } = await db.from("feedback").insert({
        message: message.trim(),
        email: email || null,
        rating: rating || null,
        page_url: page_url || null,
      });
      if (error) {
        // Log but don't fail — feedback should never block the user
        console.error("Feedback insert error:", error.message);
      }
    } else {
      // Supabase not configured — log locally so nothing is lost
      console.log("[Feedback]", { message, email, rating, page_url });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Feedback API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
