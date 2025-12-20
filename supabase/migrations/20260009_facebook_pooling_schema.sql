-- =====================================================
-- Facebook Pooling Schema (DDL)
-- Pools + pooled listings + scrape run audit + demand tracking
-- =====================================================

-- 1) Pool Registry
CREATE TABLE IF NOT EXISTS public.fb_pools (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  market text not null,           -- e.g. UK
  city text not null,             -- e.g. London
  radius_km integer default 25,

  category text not null,         -- phones, laptops, consoles
  query_template text,            -- optional keyword

  refresh_ttl_seconds integer not null default 3600,
  max_pages integer not null default 3,

  priority integer not null default 3, -- 1 (highest) → 5 (lowest)

  enabled boolean not null default true,

  status text not null default 'healthy',
  -- healthy | degraded | paused

  last_success_at timestamptz,
  last_attempt_at timestamptz,

  consecutive_failures integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS fb_pools_enabled_status_idx ON public.fb_pools (enabled, status);
CREATE INDEX IF NOT EXISTS fb_pools_priority_idx ON public.fb_pools (priority);
CREATE INDEX IF NOT EXISTS fb_pools_last_success_at_idx ON public.fb_pools (last_success_at);

-- 2) Listings Store (Pooled Data)
CREATE TABLE IF NOT EXISTS public.fb_listings (
  id uuid primary key default gen_random_uuid(),

  pool_id uuid not null references public.fb_pools(id) on delete cascade,

  source text not null default 'facebook',
  source_listing_id text not null,

  title text,
  price numeric,
  currency text,

  location_text text,
  posted_at timestamptz,

  seller_meta jsonb,

  url text,

  hash_fingerprint text not null,

  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),

  is_active boolean not null default true
);

CREATE UNIQUE INDEX IF NOT EXISTS fb_listings_source_listing_id_key ON public.fb_listings (source_listing_id);
CREATE INDEX IF NOT EXISTS fb_listings_pool_last_seen_idx ON public.fb_listings (pool_id, last_seen_at desc);
CREATE INDEX IF NOT EXISTS fb_listings_pool_active_idx ON public.fb_listings (pool_id, is_active);

-- 3) Scrape Run Audit (Optional but Recommended)
CREATE TABLE IF NOT EXISTS public.fb_scrape_runs (
  id uuid primary key default gen_random_uuid(),

  pool_id uuid not null references public.fb_pools(id),

  apify_run_id text,
  status text not null, -- success | failed | partial

  listing_count integer default 0,
  cost_estimate numeric,

  started_at timestamptz not null,
  finished_at timestamptz,

  error_message text
);

CREATE INDEX IF NOT EXISTS fb_scrape_runs_pool_started_idx ON public.fb_scrape_runs (pool_id, started_at desc);

-- 4) Search Demand Tracking (for weighting)
CREATE TABLE IF NOT EXISTS public.search_events (
  id uuid primary key default gen_random_uuid(),

  user_id uuid,
  pool_id uuid references public.fb_pools(id),

  searched_at timestamptz not null default now(),

  is_instant boolean not null default false
);

CREATE INDEX IF NOT EXISTS search_events_pool_searched_idx ON public.search_events (pool_id, searched_at desc);

-- 5) Demand RPC
CREATE OR REPLACE FUNCTION public.fb_pool_demand_last_hour()
returns table (pool_id uuid, count bigint)
language sql
as $$
  select
    pool_id,
    count(*) as count
  from public.search_events
  where searched_at > now() - interval '1 hour'
  group by pool_id;
$$;

