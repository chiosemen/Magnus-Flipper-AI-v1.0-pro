create extension if not exists pgcrypto;

create table if not exists guardian_ingestion_runs (
  id text primary key default gen_random_uuid()::text,
  marketplace text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  status text not null,
  items integer not null,
  errors_count integer not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_guardian_ingestion_runs_marketplace_started_at
  on guardian_ingestion_runs (marketplace, started_at);

create table if not exists guardian_latest_snapshots (
  id text primary key default gen_random_uuid()::text,
  marketplace text not null unique,
  last_run_at timestamptz not null,
  last_ok_at timestamptz,
  last_error jsonb,
  lag_seconds integer not null,
  updated_at timestamptz not null default now()
);

create table if not exists guardian_invariant_results (
  id text primary key default gen_random_uuid()::text,
  ok boolean not null,
  violations jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists guardian_canary_results (
  id text primary key default gen_random_uuid()::text,
  ok boolean not null,
  results jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists guardian_alerts (
  id text primary key default gen_random_uuid()::text,
  severity text not null,
  category text not null,
  message text not null,
  created_at timestamptz not null default now(),
  context jsonb
);

create index if not exists idx_guardian_alerts_created_at
  on guardian_alerts (created_at);
