-- DeployGuardian Runs: persisted machine output for read-only ops dashboard
-- Migration Date: 2025-12-13
-- Contract Version: 2.1.0

-- Table for storing DeployGuardian validation runs
create table if not exists public.deploy_guardian_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Provenance
  environment text not null default 'production',
  mode text not null,                 -- pre-deploy | deploy | post-deploy
  status text not null,               -- pass | fail
  commit_sha text,
  actor text,
  workflow text,                      -- optional: workflow name/id
  run_id text,                        -- optional: github run id
  branch text,

  -- Contract metadata (v2.1.0+)
  contract_version text,              -- e.g., "2.1.0"
  contract_schema_hash text,          -- SHA256 hash of schema for drift detection

  -- Summary counts (fast filtering without parsing JSON)
  blockers int not null default 0,
  warnings int not null default 0,
  infos int not null default 0,

  -- Raw DeployGuardian JSON contract (single source of truth)
  payload jsonb not null
);

-- Indexes for fast queries
create index if not exists idx_dg_runs_created_at
  on public.deploy_guardian_runs (created_at desc);

create index if not exists idx_dg_runs_env_created_at
  on public.deploy_guardian_runs (environment, created_at desc);

create index if not exists idx_dg_runs_status_created_at
  on public.deploy_guardian_runs (status, created_at desc);

create index if not exists idx_dg_runs_commit_sha
  on public.deploy_guardian_runs (commit_sha);

create index if not exists idx_dg_runs_contract_version
  on public.deploy_guardian_runs (contract_version);

-- Prevent accidental duplicates from the same CI run
create unique index if not exists uq_dg_runs_run_id
  on public.deploy_guardian_runs (run_id)
  where run_id is not null;

-- Enable RLS (read-only for authenticated users)
alter table public.deploy_guardian_runs enable row level security;

-- Policy: Allow authenticated users to read all runs
create policy "Allow authenticated users to read deploy guardian runs"
  on public.deploy_guardian_runs
  for select
  to authenticated
  using (true);

-- Policy: Allow service role to insert runs (for CI ingestion)
create policy "Allow service role to insert deploy guardian runs"
  on public.deploy_guardian_runs
  for insert
  to service_role
  with check (true);

-- Comment for documentation
comment on table public.deploy_guardian_runs is 
  'Persisted DeployGuardian validation runs for read-only ops dashboard. Contract version 2.1.0+';

comment on column public.deploy_guardian_runs.payload is 
  'Complete JSON output conforming to deployguardian.contract.schema.json';

comment on column public.deploy_guardian_runs.contract_schema_hash is 
  'SHA256 hash of the schema file used for this run. Used to detect schema drift.';
