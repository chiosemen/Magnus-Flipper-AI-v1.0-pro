# API (Vercel Serverless)

Local dev:
- `cd apps/api && vercel dev --listen 3000`
- Routes live under `apps/api/api/*` and are accessed via `/api/*`
- Vercel Project Settings: Development Command must be EMPTY
- Do not run `pnpm dev` from Vercel; use `vercel dev` directly

No Express. No Azure. No background workers.

## Phase 3 setup

Run the SQL in `apps/api/supabase/sql/phase3_alerts.sql` to create saved searches,
alert runs, and listing history tables with RLS.

```sql
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
```

## Phase 6 setup

Run the SQL in `apps/api/supabase/phase6.sql` to create Deal Score tables
and daily stats for signals/insights.

Required env vars:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (api)
- `SUPABASE_ANON_KEY` (web)
- `APIFY_TOKEN`
- `ADMIN_KEY` (admin aggregate endpoint)

## Phase 8 setup

Run the SQL in `apps/api/supabase/phase8.sql` to create billing entitlements,
overrides, and billing events.

Required env vars:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO` (optional)
- `STRIPE_PRICE_AGENCY` (optional)
- `STRIPE_PRICE_ENTERPRISE` (optional)
- `ENTITLEMENT_GRACE_DAYS` (optional)
