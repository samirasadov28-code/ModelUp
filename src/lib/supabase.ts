import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { ModelOutputs } from "./types";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _client;
}

export async function upsertUser(params: {
  id: string;
  email: string;
  stripeCustomerId?: string;
  subscriptionStatus?: string;
}): Promise<void> {
  const db = getSupabase();
  if (!db) return;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // Stripe ids and emails are not auth ids. Resolve existing identity first.
  const { data: existing, error: lookupError } = await db.from("users")
    .select("id,email,stripe_customer_id").eq("email", params.email.trim().toLowerCase()).maybeSingle();
  if (lookupError) throw new Error("User identity lookup failed");
  if (!existing || !uuid.test(existing.id)) throw new Error("Authenticated user mapping required");
  if (uuid.test(params.id) && params.id !== existing.id) throw new Error("User identity conflict");
  if (!uuid.test(params.id) && (!existing.stripe_customer_id || existing.stripe_customer_id !== params.stripeCustomerId)) {
    throw new Error("Verified Stripe customer mapping required");
  }
  if (existing.stripe_customer_id && params.stripeCustomerId && existing.stripe_customer_id !== params.stripeCustomerId) {
    throw new Error("Stripe customer identity conflict");
  }
  const { error } = await db.from("users").update({
    stripe_customer_id: params.stripeCustomerId ?? existing.stripe_customer_id,
    subscription_status: params.subscriptionStatus ?? "free",
    updated_at: new Date().toISOString(),
  }).eq("id", existing.id);
  if (error) throw new Error("User entitlement write failed");
}

export async function getUserSubscriptionStatus(userId: string): Promise<string> {
  const db = getSupabase();
  if (!db) return "free";
  const { data } = await db
    .from("users")
    .select("subscription_status")
    .eq("id", userId)
    .single();
  return (data?.subscription_status as string) ?? "free";
}

export async function saveModelToDb(params: {
  id: string;
  userId?: string;
  name: string;
  modelType: string;
  sourceModel: string;
  answers: object;
  outputs: object;
}): Promise<void> {
  const db = getSupabase();
  if (!db) return;
  await db.from("models").upsert({
    id: params.id,
    user_id: params.userId,
    name: params.name,
    model_type: params.modelType,
    source_model: params.sourceModel,
    questionnaire_answers: params.answers,
    model_outputs: params.outputs,
    updated_at: new Date().toISOString(),
  });
}

export async function getModelFromDb(id: string): Promise<ModelOutputs | null> {
  const db = getSupabase();
  if (!db) return null;
  const { data, error } = await db
    .from("models")
    .select("model_outputs")
    .eq("id", id)
    .maybeSingle();
  if (error || !data?.model_outputs) return null;
  return data.model_outputs as ModelOutputs;
}
