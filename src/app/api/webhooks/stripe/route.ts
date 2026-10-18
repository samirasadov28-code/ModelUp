import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { claimEvent, releaseEvent, recordPurchase, setStatusByPaymentIntent } from "@/lib/pro-purchases";

export const runtime = "nodejs";

/** Validates the paid session is for exactly our Pro price, using SUBTOTAL (not total, which drops with coupons/tax). */
async function validateAndRecord(stripe: Stripe, sessionId: string, livemodeOfEvent: boolean) {
  const expectedPrice = process.env.STRIPE_PRICE_ID_PRO_MONTHLY;
  if (!expectedPrice) throw new Error("STRIPE_PRICE_ID_PRO_MONTHLY not set");

  const session = await stripe.checkout.sessions.retrieve(sessionId); // fresh state, not the event payload
  if (session.mode !== "payment") return;
  if (session.payment_status !== "paid") return;          // async methods fire a later event
  if (session.metadata?.product !== "modelup_pro") return;

  const items = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 10 });
  if (items.data.length !== 1) return;
  const li = items.data[0];
  if (li.price?.id !== expectedPrice || li.quantity !== 1) return;
  if (li.price.unit_amount == null || li.amount_subtotal !== li.price.unit_amount) return;

  await recordPurchase({
    sessionId,
    paymentIntent: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
    email: session.customer_details?.email ?? null,
    amountSubtotal: li.amount_subtotal,
    currency: session.currency ?? "usd",
    livemode: livemodeOfEvent,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let claimed = false;
  try {
    claimed = await claimEvent(event.id, event.type);
    if (!claimed) return NextResponse.json({ received: true, duplicate: true });

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const s = event.data.object as Stripe.Checkout.Session;
        await validateAndRecord(stripe, s.id, event.livemode);
        break;
      }
      case "charge.refunded": {
        const c = event.data.object as Stripe.Charge;
        // Revoke on any refund; a partial refund is treated as a revoke too (conservative).
        const pi = typeof c.payment_intent === "string" ? c.payment_intent : c.payment_intent?.id;
        if (pi && c.refunded) await setStatusByPaymentIntent(pi, "refunded");
        break;
      }
      case "charge.dispute.created": {
        const d = event.data.object as Stripe.Dispute;
        const pi = typeof d.payment_intent === "string" ? d.payment_intent : d.payment_intent?.id;
        if (pi) await setStatusByPaymentIntent(pi, "disputed");
        break;
      }
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    if (claimed) await releaseEvent(event.id); // let Stripe retry
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}
