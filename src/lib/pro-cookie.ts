import { createHmac, timingSafeEqual } from "crypto";

export const PRO_COOKIE = "mu_pro";
export const NONCE_COOKIE = "mu_checkout_nonce";

function secret(): string {
  const s = process.env.PRO_COOKIE_SECRET;
  if (!s || s.length < 32) throw new Error("PRO_COOKIE_SECRET (32+ chars) is not set");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Cookie value: <session_id>.<signature>. The cookie only proves "this browser redeemed that session". */
export function makeProCookie(sessionId: string): string {
  return `${sessionId}.${sign(sessionId)}`;
}

export function readProCookie(value: string | undefined): string | null {
  if (!value) return null;
  const i = value.lastIndexOf(".");
  if (i < 1) return null;
  const sessionId = value.slice(0, i);
  const sig = value.slice(i + 1);
  const expected = sign(sessionId);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return sessionId;
}
