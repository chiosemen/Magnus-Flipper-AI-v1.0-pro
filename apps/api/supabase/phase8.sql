create extension if not exists pgcrypto;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  status text,
  tier text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text,
  add column if not exists status text,
  add column if not exists tier text,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists subscriptions_stripe_id_idx
  on public.subscriptions (stripe_subscription_id);

create index if not exists subscriptions_customer_idx
  on public.subscriptions (stripe_customer_id);

create index if not exists subscriptions_user_idx
  on public.subscriptions (user_id);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tier text not null,
  status text not null,
  grace_until timestamptz,
  source text,
  overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists entitlements_user_idx
  on public.entitlements (user_id);

create table if not exists public.entitlement_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tier text not null,
  reason text,
  active boolean not null default true,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists entitlement_overrides_user_idx
  on public.entitlement_overrides (user_id, active);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  event_type text not null,
  status text not null,
  intent jsonb,
  usage jsonb,
  blocked_reason text,
  metadata jsonb,
  stripe_event_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists billing_events_stripe_event_idx
  on public.billing_events (stripe_event_id);

create index if not exists billing_events_user_idx
  on public.billing_events (user_id, created_at desc);

alter table public.subscriptions enable row level security;
alter table public.entitlements enable row level security;
alter table public.entitlement_overrides enable row level security;
alter table public.billing_events enable row level security;

create policy "entitlements_select_own"
  on public.entitlements for select
  using (auth.uid() = user_id);

create policy "billing_events_select_own"
  on public.billing_events for select
  using (auth.uid() = user_id);
