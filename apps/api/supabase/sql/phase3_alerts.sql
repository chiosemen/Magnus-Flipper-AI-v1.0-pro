create extension if not exists pgcrypto;

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  queries text[] not null,
  markets text[] not null,
  geo jsonb not null default '{}'::jsonb,
  frequency text not null default 'daily',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.alert_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  saved_search_id uuid not null,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  matches_found int not null default 0,
  meta jsonb not null default '{}'::jsonb
);

create table if not exists public.listing_seen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  saved_search_id uuid not null,
  marketplace text not null,
  listing_url text not null,
  first_seen_at timestamptz not null default now(),
  unique (user_id, saved_search_id, marketplace, listing_url)
);

create index if not exists saved_searches_user_id_idx on public.saved_searches (user_id);
create index if not exists saved_searches_enabled_idx on public.saved_searches (enabled);
create index if not exists alert_runs_user_id_idx on public.alert_runs (user_id, started_at desc);
create index if not exists listing_seen_user_id_idx on public.listing_seen (user_id, saved_search_id);

alter table public.saved_searches enable row level security;
alter table public.alert_runs enable row level security;
alter table public.listing_seen enable row level security;

drop policy if exists "saved_searches_select_own" on public.saved_searches;
create policy "saved_searches_select_own"
  on public.saved_searches for select
  using (auth.uid() = user_id);

drop policy if exists "saved_searches_insert_own" on public.saved_searches;
create policy "saved_searches_insert_own"
  on public.saved_searches for insert
  with check (auth.uid() = user_id);

drop policy if exists "saved_searches_update_own" on public.saved_searches;
create policy "saved_searches_update_own"
  on public.saved_searches for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saved_searches_delete_own" on public.saved_searches;
create policy "saved_searches_delete_own"
  on public.saved_searches for delete
  using (auth.uid() = user_id);

drop policy if exists "alert_runs_select_own" on public.alert_runs;
create policy "alert_runs_select_own"
  on public.alert_runs for select
  using (auth.uid() = user_id);

drop policy if exists "alert_runs_insert_own" on public.alert_runs;
create policy "alert_runs_insert_own"
  on public.alert_runs for insert
  with check (auth.uid() = user_id);

drop policy if exists "listing_seen_select_own" on public.listing_seen;
create policy "listing_seen_select_own"
  on public.listing_seen for select
  using (auth.uid() = user_id);

drop policy if exists "listing_seen_insert_own" on public.listing_seen;
create policy "listing_seen_insert_own"
  on public.listing_seen for insert
  with check (auth.uid() = user_id);
