-- =====================================================
-- Apify budget caps + plan limits + usage metering
-- =====================================================

-- A) Budget settings + daily spend ledger
CREATE TABLE IF NOT EXISTS public.apify_budget_settings (
  id int primary key default 1,
  currency text not null default 'GBP',

  daily_soft_cap_gbp numeric not null default 50,
  daily_hard_cap_gbp numeric not null default 80,

  -- if true, priority=1 pools can still refresh after hard cap (use carefully)
  allow_critical_after_hard boolean not null default false,

  updated_at timestamptz not null default now()
);

INSERT INTO public.apify_budget_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.apify_spend_ledger_daily (
  day date primary key,
  currency text not null default 'GBP',
  spent_gbp numeric not null default 0,
  runs integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Atomic daily spend increment to avoid lost updates under concurrency.
CREATE OR REPLACE FUNCTION public.apify_spend_add_gbp(amount_gbp numeric)
returns public.apify_spend_ledger_daily
language sql
as $$
  insert into public.apify_spend_ledger_daily (day, currency, spent_gbp, runs, updated_at)
  values (current_date, 'GBP', amount_gbp, 1, now())
  on conflict (day) do update
    set spent_gbp = public.apify_spend_ledger_daily.spent_gbp + excluded.spent_gbp,
        runs = public.apify_spend_ledger_daily.runs + 1,
        updated_at = now()
  returning *;
$$;

-- B) Plans + limits (concurrency + credits)
CREATE TABLE IF NOT EXISTS public.plans (
  id text primary key, -- e.g. trial, offer1, offer2, offer3, offer4, custom
  name text not null,

  max_concurrent_instant integer not null default 1,
  max_concurrent_timed integer not null default 1,

  daily_instant_credits integer not null default 0,
  daily_timed_credits integer not null default 0,

  marketplace_scope text not null default 'facebook',
  -- facebook | all

  created_at timestamptz not null default now()
);

-- Seed examples (edit to your real mapping)
INSERT INTO public.plans (
  id,
  name,
  max_concurrent_instant,
  max_concurrent_timed,
  daily_instant_credits,
  daily_timed_credits,
  marketplace_scope
)
VALUES
  ('trial','7-day trial', 0, 1, 0, 1, 'facebook'),
  ('offer1','Offer 1', 1, 1, 1, 3, 'facebook'),
  ('offer2','Offer 2', 1, 1, 5, 0, 'facebook'),
  ('offer3a','Offer 3A', 2, 1, 0, 5, 'all'),
  ('offer3b','Offer 3B', 2, 1, 5, 0, 'all'),
  ('offer4','Offer 4', 3, 1, 10, 0, 'all')
ON CONFLICT (id) DO NOTHING;

-- Attach plan_id to the existing subscriptions table (source of truth).
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subscriptions_plan_id_fkey'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_plan_id_fkey
      FOREIGN KEY (plan_id)
      REFERENCES public.plans(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS subscriptions_plan_id_status_idx
  ON public.subscriptions (plan_id, payment_status);

-- Provide a stable, read-only projection for app/services that expect `user_subscriptions`.
-- NOTE: This is a VIEW (not a table) to avoid duplicating subscription sources.
CREATE OR REPLACE VIEW public.user_subscriptions AS
SELECT
  s.user_id,
  s.plan_id,
  COALESCE(
    s.payment_status,
    CASE WHEN s.is_active THEN 'active' ELSE 'canceled' END
  ) AS status,
  s.tier,
  s.is_active,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.stripe_price_id,
  COALESCE(s.current_period_start, s.created_at) AS started_at,
  s.current_period_end AS ends_at
FROM public.subscriptions s;

-- C) Usage metering (credits) + optional priority refresh requests
CREATE TABLE IF NOT EXISTS public.user_search_usage_daily (
  day date not null,
  user_id uuid not null,
  instant_used integer not null default 0,
  timed_used integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (day, user_id)
);

CREATE TABLE IF NOT EXISTS public.user_refresh_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  pool_id uuid not null references public.fb_pools(id),
  is_instant boolean not null default false,
  created_at timestamptz not null default now(),
  status text not null default 'queued' -- queued | served | rejected
);

CREATE INDEX IF NOT EXISTS user_refresh_requests_pool_created_idx
  ON public.user_refresh_requests (pool_id, created_at desc);

