-- ModelUp one-off Pro purchases. Apply to the TEST/preview Supabase first.
create table if not exists pro_purchases (
  session_id        text primary key,            -- Stripe Checkout Session id
  payment_intent    text unique,                 -- for refund/dispute lookup
  email             text,
  amount_subtotal   integer not null,            -- minor units, before discounts/tax
  currency          text not null,
  livemode          boolean not null,
  status            text not null default 'active' check (status in ('active','refunded','disputed')),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
create table if not exists stripe_events_processed (
  event_id    text primary key,
  type        text not null,
  received_at timestamptz default now()
);
alter table pro_purchases enable row level security;
alter table stripe_events_processed enable row level security;
-- No policies: only the service-role key (server) can read or write these tables.
