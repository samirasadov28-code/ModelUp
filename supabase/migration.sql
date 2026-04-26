-- ModelUp — Initial Schema
-- Run this in: https://supabase.com/dashboard/project/odgmpanismjrnpbzlhqt/sql/new

-- ── Users ────────────────────────────────────────────────────────────────────
create table if not exists users (
  id                    uuid primary key default gen_random_uuid(),
  email                 text unique not null,
  stripe_customer_id    text,
  subscription_status   text default 'free',   -- free | trialing | active | canceled
  subscription_end_date timestamptz,
  trial_end             timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ── Models ───────────────────────────────────────────────────────────────────
create table if not exists models (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references users(id) on delete set null,
  name                  text not null default 'Untitled Model',
  model_type            text not null default 'saas',   -- saas | alternative | project_finance
  source_model          text,
  questionnaire_answers jsonb,
  model_outputs         jsonb,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table users  enable row level security;
alter table models enable row level security;

-- Users can read and update only their own row
create policy if not exists "users_self_rw" on users
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Users can read and write only their own models
create policy if not exists "models_owner_rw" on models
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Updated-at trigger ────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger users_updated_at
  before update on users
  for each row execute function set_updated_at();

create or replace trigger models_updated_at
  before update on models
  for each row execute function set_updated_at();

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists models_user_id_idx on models(user_id);
create index if not exists users_stripe_id_idx on users(stripe_customer_id);
create index if not exists users_email_idx on users(email);
