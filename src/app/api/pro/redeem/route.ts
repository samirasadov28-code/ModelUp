import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { isSessionActive } from "@/lib/pro-purchases";
import { NONCE_COOKIE, PRO_COOKIE, makeProCookie } from "@/lib/pro-cookie";

export const runtime = "nodejs";

/** Called from the success page with ?session_id=. Needs the nonce cookie set at checkout and a webhook-recorded purchase. */
export async function POST(req: NextRequest) {
  const { sessionId } = await req.json().catch(() => ({}));
  if (typeof sessionId !== "string" || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return NextResponse.json({ error: "Bad session" }, { status: 400 });
  }
  const nonce = req.cookies.get(NONCE_COOKIE)?.value;
  if (!nonce) return NextResponse.json({ error: "Open the link in the same browser you paid from" }, { status: 403 });

  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.metadata?.nonce !== nonce || session.payment_status !== "paid") {
    return NextResponse.json({ error: "Not verified" }, { status: 403 });
  }
  // Webhook may lag the redirect by a few seconds: tell the client to retry.
  if (!(await isSessionActive(sessionId))) return NextResponse.json({ pending: true }, { status: 202 });

  const res = NextResponse.json({ pro: true });
  res.cookies.set(PRO_COOKIE, makeProCookie(sessionId), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 * 5,
  });
  return res;
}
