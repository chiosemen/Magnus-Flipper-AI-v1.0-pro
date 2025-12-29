create table if not exists cost_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  run_id uuid not null,
  source text not null check (source in ('search', 'alert', 'auto_arbitrage')),
  marketplace text not null,
  actor_id text not null,
  cu_estimated numeric not null,
  cu_actual numeric not null,
  proxy_type text not null check (proxy_type in ('datacenter', 'residential')),
  executed_at timestamptz not null default now()
);

create index if not exists cost_ledger_user_idx on cost_ledger (user_id);
create index if not exists cost_ledger_run_idx on cost_ledger (run_id);
create index if not exists cost_ledger_executed_at_idx on cost_ledger (executed_at desc);

alter table cost_ledger enable row level security;

drop policy if exists "Users can read their own cost ledger" on cost_ledger;
create policy "Users can read their own cost ledger"
  on cost_ledger
  for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can insert cost ledger" on cost_ledger;
create policy "Service role can insert cost ledger"
  on cost_ledger
  for insert
  with check (auth.role() = 'service_role');
