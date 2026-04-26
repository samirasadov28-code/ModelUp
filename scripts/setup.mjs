#!/usr/bin/env node
/**
 * ModelUp one-shot setup script.
 * Run once to create Stripe product/price/webhook and Supabase tables.
 *
 * Usage (from project root):
 *   node scripts/setup.mjs
 *
 * It reads credentials from the environment — set them before running:
 *   export STRIPE_SECRET_KEY="sk_live_..."
 *   export NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
 *   export SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
 *   export NEXT_PUBLIC_APP_URL="https://modelups.netlify.app"
 *
 * Or create a .env.setup file and run:
 *   set -a && source .env.setup && node scripts/setup.mjs
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, existsSync } from "fs";
import { randomBytes } from "crypto";

// ── Credentials from environment ─────────────────────────────────────────────

const STRIPE_SK = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://modelups.netlify.app";

const missing = [];
if (!STRIPE_SK) missing.push("STRIPE_SECRET_KEY");
if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
if (!SUPABASE_SERVICE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
if (missing.length) {
  console.error("❌ Missing environment variables:", missing.join(", "));
  console.error("   See usage instructions at the top of this file.");
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(icon, msg) {
  console.log(`  ${icon}  ${msg}`);
}
function ok(msg) { log("✅", msg); }
function info(msg) { log("ℹ️ ", msg); }
function warn(msg) { log("⚠️ ", msg); }

// ── Main ─────────────────────────────────────────────────────────────────────

console.log("\n🚀 ModelUp Setup\n");

// ── 1. Stripe ─────────────────────────────────────────────────────────────────

console.log("── Stripe ──────────────────────────────────────────");

const stripe = new Stripe(STRIPE_SK, { apiVersion: "2024-06-20" });

// Check if product already exists
let productId;
const existingProducts = await stripe.products.list({ limit: 20 });
const existing = existingProducts.data.find(
  (p) => p.name === "ModelUp Pro" || p.metadata?.product === "modelup_pro"
);

if (existing) {
  productId = existing.id;
  warn(`Product already exists: ${productId}`);
} else {
  const product = await stripe.products.create({
    name: "ModelUp Pro",
    description:
      "Full interactive financial model dashboard — charts, unit economics, scenario comparison, cap table, Excel download",
    metadata: { product: "modelup_pro" },
  });
  productId = product.id;
  ok(`Created product: ${productId}`);
}

// Check if price already exists for this product
let priceId;
const existingPrices = await stripe.prices.list({ product: productId, active: true });
const existingPrice = existingPrices.data.find(
  (p) => p.unit_amount === 999 && p.recurring?.interval === "month"
);

if (existingPrice) {
  priceId = existingPrice.id;
  warn(`Price already exists: ${priceId}`);
} else {
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: 999, // $9.99
    currency: "usd",
    recurring: { interval: "month", trial_period_days: 7 },
    metadata: { plan: "pro_monthly" },
  });
  priceId = price.id;
  ok(`Created price $9.99/month with 7-day trial: ${priceId}`);
}

// Create webhook endpoint
const webhookUrl = `${APP_URL}/api/webhooks/stripe`;
let webhookSecret;

const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 20 });
const existingWebhook = existingWebhooks.data.find((w) => w.url === webhookUrl);

if (existingWebhook) {
  warn(`Webhook already exists for ${webhookUrl}`);
  info("Cannot retrieve existing webhook secret — check Stripe dashboard");
  info("Dashboard: https://dashboard.stripe.com/webhooks");
  webhookSecret = "RETRIEVE_FROM_STRIPE_DASHBOARD";
} else {
  const webhook = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: [
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "checkout.session.completed",
    ],
  });
  webhookSecret = webhook.secret;
  ok(`Created webhook → ${webhookUrl}`);
  ok(`Webhook secret: ${webhookSecret}`);
}

// ── 2. Supabase ───────────────────────────────────────────────────────────────

console.log("\n── Supabase ─────────────────────────────────────────");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Run migration SQL via supabase.rpc if possible, else write SQL file
const migrationSQL = `
-- ModelUp database schema
-- Run this in your Supabase SQL Editor if the script can't auto-apply it.

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  stripe_customer_id    text,
  subscription_status   text default 'free',
  subscription_end_date timestamptz,
  trial_end             timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists models (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references users(id) on delete set null,
  name                  text not null default 'Untitled Model',
  model_type            text not null default 'saas',
  source_model          text,
  questionnaire_answers jsonb,
  model_outputs         jsonb,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Row Level Security
alter table users enable row level security;
alter table models enable row level security;

-- Users can read/update their own row
create policy if not exists "users_self_rw" on users
  using (auth.uid() = id) with check (auth.uid() = id);

-- Users can read/write their own models
create policy if not exists "models_owner_rw" on models
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Service role bypasses RLS (used by API routes)
-- No extra policy needed — service role key always bypasses RLS.
`;

// Try to verify connection with a lightweight query
const { error: pingError } = await supabase.from("users").select("id").limit(1);

if (pingError && pingError.code === "42P01") {
  // Table doesn't exist — write SQL file for manual execution
  info("Tables not yet created. Writing migration file...");
  writeFileSync("supabase/migration.sql", migrationSQL);
  warn("Run the SQL in supabase/migration.sql via Supabase dashboard → SQL Editor");
  warn("URL: " + SUPABASE_URL.replace("supabase.co", "supabase.com/project/_/sql/new").replace("https://", "https://supabase.com/dashboard/project/") );
} else if (pingError) {
  warn(`Supabase connection issue: ${pingError.message}`);
  writeFileSync("supabase/migration.sql", migrationSQL);
  warn("Manually run supabase/migration.sql in your Supabase SQL Editor");
} else {
  ok("Supabase connected — users table exists");
  // Check models table
  const { error: modelsError } = await supabase.from("models").select("id").limit(1);
  if (modelsError?.code === "42P01") {
    writeFileSync("supabase/migration.sql", migrationSQL);
    warn("models table missing — run supabase/migration.sql in SQL Editor");
  } else {
    ok("Supabase models table exists");
  }
}

// ── 3. Generate .env.local ────────────────────────────────────────────────────

console.log("\n── Environment Variables ────────────────────────────");

const nextauthSecret = randomBytes(32).toString("base64url");

const envContent = `# Generated by scripts/setup.mjs — do NOT commit this file

# Grok (xAI)
GROK_API_KEY=${process.env.GROK_API_KEY || "YOUR_GROK_API_KEY"}

# Supabase
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY"}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY}

# Stripe
STRIPE_SECRET_KEY=${STRIPE_SK}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "REPLACE_WITH_STRIPE_PUBLISHABLE_KEY"}
STRIPE_WEBHOOK_SECRET=${webhookSecret}
STRIPE_PRICE_ID_PRO_MONTHLY=${priceId}

# Auth
NEXTAUTH_URL=${APP_URL}
NEXTAUTH_SECRET=${nextauthSecret}

# App
NEXT_PUBLIC_APP_URL=${APP_URL}
PYTHON_SERVICE_URL=http://localhost:8000

# Gates
NEXT_PUBLIC_GATE_ENABLED=false
`;

// Only write .env.local if it doesn't already exist
if (!existsSync(".env.local")) {
  writeFileSync(".env.local", envContent);
  ok("Wrote .env.local");
} else {
  warn(".env.local already exists — writing to .env.local.generated instead");
  writeFileSync(".env.local.generated", envContent);
  ok("Wrote .env.local.generated");
}

// ── 4. Summary ────────────────────────────────────────────────────────────────

console.log(`
╔════════════════════════════════════════════════════╗
║           ModelUp Setup Complete                   ║
╚════════════════════════════════════════════════════╝

Stripe Product ID  : ${productId}
Stripe Price ID    : ${priceId}
Stripe Webhook     : ${webhookUrl}
Webhook Secret     : ${webhookSecret.startsWith("whsec_") ? webhookSecret.slice(0, 12) + "..." : webhookSecret}

Next steps:
  1. Copy the env vars from .env.local (or .env.local.generated) into
     Netlify → Site settings → Environment variables
     https://app.netlify.com/sites/modelups/configuration/env

  2. If Supabase tables are missing, run supabase/migration.sql in:
     https://supabase.com/dashboard/project/odgmpanismjrnpbzlhqt/sql/new

  3. Add your Stripe Publishable Key to Netlify:
     https://dashboard.stripe.com/apikeys → copy "Publishable key"

  4. Trigger a new Netlify deploy after setting env vars.
`);
