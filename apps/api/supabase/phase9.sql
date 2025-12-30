create extension if not exists pgcrypto;

create table if not exists public.deal_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  market text not null,
  query text not null,
  score numeric not null,
  confidence text not null,
  signals jsonb not null default '{}'::jsonb,
  explanation text[] not null default '{}'::text[],
  listing jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists deal_scores_user_idx
  on public.deal_scores (user_id, created_at desc);

create index if not exists deal_scores_market_idx
  on public.deal_scores (market, query, created_at desc);

create table if not exists public.market_stats_daily (
  market text not null,
  query text not null,
  geo_cell text,
  stat_date date not null,
  median_price numeric,
  count_listings int,
  updated_at timestamptz not null default now(),
  primary key (market, query, geo_cell, stat_date)
);

create table if not exists public.price_distributions (
  market text not null,
  query text not null,
  geo_cell text,
  stat_date date not null,
  p10 numeric,
  p50 numeric,
  p90 numeric,
  sample_count int,
  updated_at timestamptz not null default now(),
  primary key (market, query, geo_cell, stat_date)
);

create table if not exists public.deal_explanations (
  id uuid primary key default gen_random_uuid(),
  deal_score_id uuid not null references public.deal_scores(id) on delete cascade,
  line text not null,
  created_at timestamptz not null default now()
);

create index if not exists deal_explanations_score_idx
  on public.deal_explanations (deal_score_id);

alter table public.deal_scores enable row level security;
alter table public.deal_explanations enable row level security;
alter table public.market_stats_daily enable row level security;
alter table public.price_distributions enable row level security;

create policy "deal_scores_read_own"
  on public.deal_scores for select
  using (auth.uid() = user_id);

create policy "deal_explanations_read_own"
  on public.deal_explanations for select
  using (
    exists (
      select 1
      from public.deal_scores
      where public.deal_scores.id = deal_explanations.deal_score_id
        and public.deal_scores.user_id = auth.uid()
    )
  );
