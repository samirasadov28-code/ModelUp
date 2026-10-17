import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getStripe } from "@/lib/stripe";
import { NONCE_COOKIE } from "@/lib/pro-cookie";

export async function POST(req: NextRequest) {
  try {
    const { modelId } = await req.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const priceId = process.env.STRIPE_PRICE_ID_PRO_MONTHLY; // the $4.99 one-off price
    if (!priceId) return NextResponse.json({ error: "Stripe price not configured" }, { status: 503 });
    if (typeof modelId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(modelId)) {
      return NextResponse.json({ error: "Bad model id" }, { status: 400 });
    }

    // Random nonce bound to this browser (httpOnly cookie) and to the Stripe session (metadata).
    // Redeeming the purchase later needs both, so a leaked session_id URL alone does not unlock Pro.
    const nonce = randomBytes(24).toString("base64url");
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: modelId,
      metadata: { nonce, product: "modelup_pro" },
      success_url: `${appUrl}/model/${modelId}/full?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
    });
    if (!session.url) throw new Error("No Stripe checkout URL returned");

    const res = NextResponse.json({ url: session.url });
    res.cookies.set(NONCE_COOKIE, nonce, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24,
    });
    return res;
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
