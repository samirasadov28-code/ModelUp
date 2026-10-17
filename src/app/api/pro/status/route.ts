import { NextRequest, NextResponse } from "next/server";
import { isSessionActive } from "@/lib/pro-purchases";
import { PRO_COOKIE, readProCookie } from "@/lib/pro-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessionId = readProCookie(req.cookies.get(PRO_COOKIE)?.value);
  const pro = sessionId ? await isSessionActive(sessionId) : false;
  return NextResponse.json({ pro });
}
