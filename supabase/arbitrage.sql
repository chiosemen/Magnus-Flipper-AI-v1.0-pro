create extension if not exists "pgcrypto";

create table if not exists arbitrage_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  buy_market text not null,
  sell_market text not null,
  queries text[] not null,
  min_profit_pct numeric not null default 0,
  min_profit_abs numeric not null default 0,
  geo jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists arbitrage_runs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references arbitrage_rules(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  cu_spent numeric,
  matches_found int not null default 0,
  notes jsonb
);

create table if not exists arbitrage_matches (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references arbitrage_runs(id) on delete cascade,
  item_buy jsonb not null,
  item_sell jsonb not null,
  buy_price numeric not null,
  sell_price numeric not null,
  profit_abs numeric not null,
  profit_pct numeric not null,
  confidence_score numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists arbitrage_rules_user_id_idx on arbitrage_rules (user_id);
create index if not exists arbitrage_rules_enabled_idx on arbitrage_rules (enabled);
create index if not exists arbitrage_runs_user_id_idx on arbitrage_runs (user_id, started_at desc);
create index if not exists arbitrage_runs_rule_id_idx on arbitrage_runs (rule_id, started_at desc);
create index if not exists arbitrage_matches_run_id_idx on arbitrage_matches (run_id);

alter table arbitrage_rules enable row level security;
alter table arbitrage_runs enable row level security;
alter table arbitrage_matches enable row level security;

create policy "arbitrage_rules_select_own"
  on arbitrage_rules for select
  using (auth.uid() = user_id);

create policy "arbitrage_rules_insert_own"
  on arbitrage_rules for insert
  with check (auth.uid() = user_id);

create policy "arbitrage_rules_update_own"
  on arbitrage_rules for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "arbitrage_rules_delete_own"
  on arbitrage_rules for delete
  using (auth.uid() = user_id);

create policy "arbitrage_runs_select_own"
  on arbitrage_runs for select
  using (auth.uid() = user_id);

create policy "arbitrage_runs_insert_service"
  on arbitrage_runs for insert
  with check (auth.role() = 'service_role');

create policy "arbitrage_matches_select_own"
  on arbitrage_matches for select
  using (
    exists (
      select 1
      from arbitrage_runs
      where arbitrage_runs.id = arbitrage_matches.run_id
        and arbitrage_runs.user_id = auth.uid()
    )
  );

create policy "arbitrage_matches_insert_service"
  on arbitrage_matches for insert
  with check (auth.role() = 'service_role');
