import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
  await db.from("users").upsert({
    id: params.id,
    email: params.email,
    stripe_customer_id: params.stripeCustomerId,
    subscription_status: params.subscriptionStatus ?? "free",
    updated_at: new Date().toISOString(),
  });
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
