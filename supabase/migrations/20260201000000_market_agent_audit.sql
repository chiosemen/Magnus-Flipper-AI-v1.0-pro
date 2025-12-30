create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  stripe_customer_id text,
  stripe_subscription_id text,
  event_type text not null,
  event_created bigint not null,
  status text not null default 'received',
  message text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists stripe_webhook_events_customer_idx
  on public.stripe_webhook_events (stripe_customer_id, event_created desc);

create index if not exists stripe_webhook_events_subscription_idx
  on public.stripe_webhook_events (stripe_subscription_id, event_created desc);

alter table public.market_agent_usage_rollups_daily
  add column if not exists seed_ingests integer not null default 0;

alter table public.market_agent_usage_rollups_daily
  add column if not exists billable_runs integer not null default 0;

create table if not exists public.market_agent_usage_queries_daily (
  user_id uuid not null,
  date date not null,
  query_norm text not null,
  primary key (user_id, date, query_norm),
  constraint fk_usage_queries_user foreign key (user_id) references auth.users(id) on delete cascade
);

create or replace function public.increment_market_agent_rollup(
  p_user_id uuid,
  p_date date,
  p_runs integer,
  p_refresh_ticks integer,
  p_seed_ingests integer,
  p_items_returned integer,
  p_billable_runs integer,
  p_query_norm text
) returns void
language plpgsql
as $$
declare
  unique_delta integer := 0;
begin
  if p_query_norm is not null and length(trim(p_query_norm)) > 0 then
    insert into public.market_agent_usage_queries_daily(user_id, date, query_norm)
    values (p_user_id, p_date, p_query_norm)
    on conflict do nothing;
    get diagnostics unique_delta = row_count;
  end if;

  insert into public.market_agent_usage_rollups_daily (
    user_id,
    date,
    runs,
    refresh_ticks,
    seed_ingests,
    items_returned,
    unique_queries,
    billable_runs
  ) values (
    p_user_id,
    p_date,
    p_runs,
    p_refresh_ticks,
    p_seed_ingests,
    p_items_returned,
    unique_delta,
    p_billable_runs
  )
  on conflict (user_id, date) do update set
    runs = public.market_agent_usage_rollups_daily.runs + excluded.runs,
    refresh_ticks = public.market_agent_usage_rollups_daily.refresh_ticks + excluded.refresh_ticks,
    seed_ingests = public.market_agent_usage_rollups_daily.seed_ingests + excluded.seed_ingests,
    items_returned = public.market_agent_usage_rollups_daily.items_returned + excluded.items_returned,
    unique_queries = public.market_agent_usage_rollups_daily.unique_queries + unique_delta,
    billable_runs = public.market_agent_usage_rollups_daily.billable_runs + excluded.billable_runs;
end;
$$;
