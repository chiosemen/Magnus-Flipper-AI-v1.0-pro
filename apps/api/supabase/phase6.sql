create extension if not exists pgcrypto;

create table if not exists public.listings_normalized (
  id uuid primary key default gen_random_uuid(),
  market text not null,
  query text not null,
  title text,
  price numeric,
  currency text,
  url text,
  image text,
  location_text text,
  lat float8,
  lng float8,
  radius_km numeric,
  geo_cell text,
  posted_at timestamptz,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists listings_normalized_market_query_idx
  on public.listings_normalized (market, query, fetched_at desc);

create index if not exists listings_normalized_geo_idx
  on public.listings_normalized (geo_cell);

create table if not exists public.listing_stats_daily (
  id uuid primary key default gen_random_uuid(),
  market text not null,
  query text not null,
  geo_cell text,
  stat_date date not null,
  median_price numeric,
  count_listings int,
  updated_at timestamptz not null default now()
);

create unique index if not exists listing_stats_daily_unique
  on public.listing_stats_daily (market, query, geo_cell, stat_date);

create table if not exists public.deal_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  market text not null,
  query text not null,
  score numeric not null,
  confidence text not null,
  explanation text[] not null default '{}'::text[],
  warnings text[] not null default '{}'::text[],
  listing jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists deal_signals_user_idx
  on public.deal_signals (user_id, created_at desc);

create table if not exists public.user_preferences (
  user_id uuid primary key,
  category_weights jsonb not null default '{}'::jsonb,
  min_margin_pct numeric,
  min_margin_abs numeric,
  updated_at timestamptz not null default now()
);

alter table public.listings_normalized enable row level security;
alter table public.listing_stats_daily enable row level security;
alter table public.deal_signals enable row level security;
alter table public.user_preferences enable row level security;

create policy "deal_signals_read_own"
  on public.deal_signals for select
  using (auth.uid() = user_id);

create policy "user_preferences_read_own"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "user_preferences_upsert_own"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "user_preferences_update_own"
  on public.user_preferences for update
  using (auth.uid() = user_id);
