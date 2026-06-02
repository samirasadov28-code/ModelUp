import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const FEEDBACK_RECIPIENT = process.env.FEEDBACK_EMAIL ?? "finmodelup@gmail.com";
const FEEDBACK_FROM = process.env.FEEDBACK_FROM ?? "ModelUp Feedback <onboarding@resend.dev>";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmail(payload: {
  message: string;
  email: string | null;
  rating: number | null;
  page_url: string | null;
}) {
  const { message, email, rating, page_url } = payload;
  const stars = rating ? "⭐".repeat(Math.max(0, Math.min(5, rating))) : "—";
  const subjectStars = rating ? ` (${rating}★)` : "";
  const subject = `[ModelUp feedback]${subjectStars} ${message.slice(0, 60).replace(/\s+/g, " ")}`;

  const text = [
    `New ModelUp feedback`,
    ``,
    `Rating: ${stars}`,
    `From: ${email || "anonymous"}`,
    `Page: ${page_url || "n/a"}`,
    ``,
    `Message:`,
    message,
  ].join("\n");

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
      <h2 style="margin:0 0 16px;color:#1e3a8a;font-size:18px">New ModelUp feedback</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;width:100%;margin-bottom:16px">
        <tr><td style="padding:6px 12px 6px 0;color:#64748b;width:80px">Rating</td><td style="padding:6px 0">${stars}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64748b">From</td><td style="padding:6px 0">${escapeHtml(email || "anonymous")}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64748b">Page</td><td style="padding:6px 0"><code style="background:#f1f5f9;padding:1px 6px;border-radius:4px;font-size:12px">${escapeHtml(page_url || "n/a")}</code></td></tr>
      </table>
      <div style="border-left:3px solid #2563eb;padding:8px 14px;background:#f8fafc;border-radius:0 6px 6px 0;white-space:pre-wrap;font-size:14px;line-height:1.55">${escapeHtml(message)}</div>
    </div>
  `;

  return { subject, text, html };
}

async function sendViaResend(payload: {
  message: string;
  email: string | null;
  rating: number | null;
  page_url: string | null;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const { subject, text, html } = buildEmail(payload);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FEEDBACK_FROM,
        to: [FEEDBACK_RECIPIENT],
        reply_to: payload.email || undefined,
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Resend send failed:", res.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend network error:", err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, email, rating, page_url } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const payload = {
      message: message.trim(),
      email: email || null,
      rating: rating || null,
      page_url: page_url || null,
    };

    // Email is the primary channel — feedback should land in the inbox even
    // when Supabase isn't configured.
    const emailed = await sendViaResend(payload);

    // Mirror into Supabase when available so we keep an auditable archive.
    const db = getSupabase();
    if (db) {
      const { error } = await db.from("feedback").insert(payload);
      if (error) {
        // Log but don't fail — feedback should never block the user.
        console.error("Feedback insert error:", error.message);
      }
    } else if (!emailed) {
      // Last-resort fallback so nothing is lost during local dev.
      console.log("[Feedback]", payload);
    }

    return NextResponse.json({ ok: true, emailed });
  } catch (err) {
    console.error("Feedback API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
