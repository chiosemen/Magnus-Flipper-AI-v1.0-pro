-- 20251225_scan_billing.sql
-- Scan windows + worker heartbeats + credits + receipts + ledger + atomic decrement RPC

begin;

-- -------------------------
-- scan windows (system-wide)
-- -------------------------
create table if not exists public.scan_windows (
  id uuid primary key default gen_random_uuid(),
  marketplace text not null,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','active','closed','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_scan_windows_status on public.scan_windows(status);
create index if not exists idx_scan_windows_marketplace on public.scan_windows(marketplace);
create index if not exists idx_scan_windows_opens_at on public.scan_windows(opens_at);

-- -------------------------
-- worker heartbeats (system-wide)
-- -------------------------
create table if not exists public.worker_heartbeats (
  worker_id text primary key,
  worker_type text not null,
  marketplace text,
  state text not null default 'idle' check (state in ('idle','scanning','cooldown','error')),
  last_seen_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);

create index if not exists idx_worker_heartbeats_last_seen_at on public.worker_heartbeats(last_seen_at);
create index if not exists idx_worker_heartbeats_state on public.worker_heartbeats(state);

-- -------------------------
-- entitlements (credits for a user)
-- -------------------------
create table if not exists public.scan_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  scans_remaining integer not null check (scans_remaining >= 0),
  marketplaces text[] not null default '{}'::text[],
  expires_at timestamptz,
  source text not null check (source in ('stripe','admin')),
  stripe_customer_id text,
  stripe_session_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_scan_entitlements_user on public.scan_entitlements(user_id);
create index if not exists idx_scan_entitlements_expires on public.scan_entitlements(expires_at);

-- -------------------------
-- receipts (proof of purchase)
-- -------------------------
create table if not exists public.scan_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  amount_total integer, -- minor units (e.g., cents)
  currency text,
  scans integer not null,
  marketplaces text[] not null default '{}'::text[],
  duration_minutes integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_scan_receipts_user on public.scan_receipts(user_id);

-- -------------------------
-- ledger (append-only audit)
-- -------------------------
create table if not exists public.scan_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  event text not null check (
    event in (
      'scan_start',
      'scan_blocked_no_credits',
      'scan_terminated_budget',
      'scan_blocked_daily_budget',
      'scan_blocked_cost_exceeds_entitlement'
    )
  ),
  marketplace text,
  entitlement_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_scan_ledger_created_at on public.scan_ledger(created_at);
create index if not exists idx_scan_ledger_event on public.scan_ledger(event);
create index if not exists idx_scan_ledger_user on public.scan_ledger(user_id);

-- -------------------------
-- updated_at helper (optional)
-- -------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_scan_windows_updated_at on public.scan_windows;
create trigger trg_scan_windows_updated_at
before update on public.scan_windows
for each row execute function public.set_updated_at();

-- -------------------------
-- Atomic decrement RPC (race-safe + expiry + marketplace scope)
-- Picks the "best" entitlement: earliest expiry first, then oldest created.
-- -------------------------
create or replace function public.decrement_scan(
  p_user_id uuid,
  p_marketplace text,
  p_now timestamptz default now()
)
returns table (
  ok boolean,
  remaining_scans integer,
  entitlement_id uuid
)
language plpgsql
as $$
declare
  v_ent public.scan_entitlements%rowtype;
  v_updated integer;
begin
  -- Select an entitlement row and lock it (prevents double-spend under concurrency)
  select *
    into v_ent
  from public.scan_entitlements
  where user_id = p_user_id
    and scans_remaining > 0
    and (expires_at is null or expires_at > p_now)
    and (cardinality(marketplaces) = 0 or p_marketplace = any(marketplaces))
  order by
    coalesce(expires_at, '9999-12-31'::timestamptz) asc,
    created_at asc
  limit 1
  for update;

  if not found then
    return query select false, 0, null::uuid;
    return;
  end if;

  update public.scan_entitlements
     set scans_remaining = scans_remaining - 1
   where id = v_ent.id
     and scans_remaining > 0;

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    -- Defensive: something changed between select + update (should be rare)
    return query select false, v_ent.scans_remaining, v_ent.id;
    return;
  end if;

  -- Return post-decrement value (v_ent.scans_remaining is pre-update)
  return query select true, (v_ent.scans_remaining - 1), v_ent.id;
end;
$$;

commit;
