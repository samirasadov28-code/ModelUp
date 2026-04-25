import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { modelId } = await req.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const priceId = process.env.STRIPE_PRICE_ID_PRO_MONTHLY;

    if (!priceId) {
      return NextResponse.json({ error: "Stripe price not configured" }, { status: 503 });
    }

    const url = await createCheckoutSession({
      priceId,
      successUrl: `${appUrl}/model/${modelId}/full?subscribed=1`,
      cancelUrl: `${appUrl}/pricing`,
      trialDays: 7,
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
