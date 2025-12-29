create extension if not exists pgcrypto;

create table if not exists public.cost_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  run_id uuid not null,
  source text not null,
  marketplace text not null,
  actor_id text,
  cu_estimated numeric not null,
  cu_actual numeric,
  proxy_type text,
  executed_at timestamptz not null default now()
);

create index if not exists cost_ledger_user_id_idx on public.cost_ledger (user_id);
create index if not exists cost_ledger_executed_at_idx on public.cost_ledger (executed_at);

alter table public.cost_ledger enable row level security;

create policy "Users can read own cost ledger"
  on public.cost_ledger
  for select
  using (auth.uid() = user_id);
