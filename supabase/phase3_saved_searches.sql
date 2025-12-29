create extension if not exists "pgcrypto";

create table if not exists saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  queries text[] not null,
  markets text[] not null,
  geo jsonb,
  max_price numeric,
  min_price numeric,
  frequency text not null check (frequency in ('daily', 'weekly')),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists search_alerts (
  id uuid primary key default gen_random_uuid(),
  saved_search_id uuid references saved_searches(id) on delete cascade,
  trigger_type text not null check (trigger_type in ('new_listing', 'price_drop')),
  last_run_at timestamptz,
  enabled boolean not null default true
);

create table if not exists alert_runs (
  id uuid primary key default gen_random_uuid(),
  saved_search_id uuid references saved_searches(id) on delete cascade,
  run_at timestamptz not null default now(),
  cu_spent numeric,
  matches_found int not null default 0,
  status text not null,
  items jsonb,
  matches jsonb
);

create index if not exists saved_searches_user_id_idx on saved_searches (user_id);
create index if not exists saved_searches_enabled_idx on saved_searches (enabled);
create index if not exists search_alerts_saved_search_id_idx on search_alerts (saved_search_id);
create index if not exists alert_runs_saved_search_id_idx on alert_runs (saved_search_id, run_at desc);

alter table saved_searches enable row level security;
alter table search_alerts enable row level security;
alter table alert_runs enable row level security;

create policy "saved_searches_select_own"
  on saved_searches for select
  using (auth.uid() = user_id);

create policy "saved_searches_insert_own"
  on saved_searches for insert
  with check (auth.uid() = user_id);

create policy "saved_searches_update_own"
  on saved_searches for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "saved_searches_delete_own"
  on saved_searches for delete
  using (auth.uid() = user_id);

create policy "search_alerts_select_own"
  on search_alerts for select
  using (
    exists (
      select 1
      from saved_searches
      where saved_searches.id = search_alerts.saved_search_id
        and saved_searches.user_id = auth.uid()
    )
  );

create policy "search_alerts_insert_own"
  on search_alerts for insert
  with check (
    exists (
      select 1
      from saved_searches
      where saved_searches.id = search_alerts.saved_search_id
        and saved_searches.user_id = auth.uid()
    )
  );

create policy "search_alerts_update_own"
  on search_alerts for update
  using (
    exists (
      select 1
      from saved_searches
      where saved_searches.id = search_alerts.saved_search_id
        and saved_searches.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from saved_searches
      where saved_searches.id = search_alerts.saved_search_id
        and saved_searches.user_id = auth.uid()
    )
  );

create policy "search_alerts_delete_own"
  on search_alerts for delete
  using (
    exists (
      select 1
      from saved_searches
      where saved_searches.id = search_alerts.saved_search_id
        and saved_searches.user_id = auth.uid()
    )
  );

create policy "alert_runs_select_own"
  on alert_runs for select
  using (
    exists (
      select 1
      from saved_searches
      where saved_searches.id = alert_runs.saved_search_id
        and saved_searches.user_id = auth.uid()
    )
  );

create policy "alert_runs_insert_own"
  on alert_runs for insert
  with check (
    exists (
      select 1
      from saved_searches
      where saved_searches.id = alert_runs.saved_search_id
        and saved_searches.user_id = auth.uid()
    )
  );
