import { getSupabase } from "@/lib/supabase";

/** True only if the session has an active purchase row. Refund/dispute flips it, so access is revoked. */
export async function isSessionActive(sessionId: string): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  const { data, error } = await db
    .from("pro_purchases")
    .select("status")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error || !data) return false;
  return data.status === "active";
}

export async function recordPurchase(p: {
  sessionId: string;
  paymentIntent: string | null;
  email: string | null;
  amountSubtotal: number;
  currency: string;
  livemode: boolean;
}): Promise<void> {
  const db = getSupabase();
  if (!db) throw new Error("Supabase not configured");
  const { error } = await db.from("pro_purchases").upsert(
    {
      session_id: p.sessionId,
      payment_intent: p.paymentIntent,
      email: p.email,
      amount_subtotal: p.amountSubtotal,
      currency: p.currency,
      livemode: p.livemode,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id", ignoreDuplicates: true }
  );
  if (error) throw new Error("Purchase write failed");
}

export async function setStatusByPaymentIntent(pi: string, status: "refunded" | "disputed"): Promise<void> {
  const db = getSupabase();
  if (!db) throw new Error("Supabase not configured");
  const { error } = await db
    .from("pro_purchases")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("payment_intent", pi);
  if (error) throw new Error("Purchase status write failed");
}

/** Returns true if this event id is new (and records it). False means already processed. */
export async function claimEvent(eventId: string, type: string): Promise<boolean> {
  const db = getSupabase();
  if (!db) throw new Error("Supabase not configured");
  const { error } = await db.from("stripe_events_processed").insert({ event_id: eventId, type });
  if (!error) return true;
  if ((error as { code?: string }).code === "23505") return false; // unique violation
  throw new Error("Event claim failed");
}

export async function releaseEvent(eventId: string): Promise<void> {
  const db = getSupabase();
  if (!db) return;
  await db.from("stripe_events_processed").delete().eq("event_id", eventId);
}
