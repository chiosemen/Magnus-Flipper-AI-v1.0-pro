-- Extended Canary Dashboard Schema
-- Additional tables needed for the summary view

-- Canary Runs Table
CREATE TABLE IF NOT EXISTS canary_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  env TEXT NOT NULL CHECK (env IN ('production', 'staging', 'local')),
  worker_id TEXT NOT NULL,
  canary_revision TEXT,
  stable_revision TEXT,
  traffic_canary NUMERIC DEFAULT 0 CHECK (traffic_canary >= 0 AND traffic_canary <= 1),
  traffic_stable NUMERIC DEFAULT 0 CHECK (traffic_stable >= 0 AND traffic_stable <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(env, worker_id, created_at)
);

-- Canary Metrics Table (extended)
CREATE TABLE IF NOT EXISTS canary_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canary_run_id UUID REFERENCES canary_runs(id) ON DELETE CASCADE,
  env TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('last_15m', 'last_60m', 'lifetime')),
  error_rate NUMERIC DEFAULT 0 CHECK (error_rate >= 0 AND error_rate <= 1),
  latency_p95_ms INTEGER DEFAULT 0,
  health_pass_rate NUMERIC DEFAULT 0 CHECK (health_pass_rate >= 0 AND health_pass_rate <= 1),
  total_requests INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker Deployments Table
CREATE TABLE IF NOT EXISTS worker_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  env TEXT NOT NULL CHECK (env IN ('production', 'staging', 'local')),
  worker_id TEXT NOT NULL,
  revision TEXT NOT NULL,
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT DEFAULT 'unknown',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_canary_runs_env_worker ON canary_runs(env, worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_canary_metrics_run_id ON canary_metrics(canary_run_id);
CREATE INDEX IF NOT EXISTS idx_canary_metrics_env_worker ON canary_metrics(env, worker_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_worker_deployments_env_worker ON worker_deployments(env, worker_id, deployed_at DESC);
CREATE INDEX IF NOT EXISTS idx_canary_ml_decisions_env_worker ON canary_ml_decisions(env, worker_id, analyzed_at DESC);

-- Row Level Security
ALTER TABLE canary_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE canary_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_deployments ENABLE ROW LEVEL SECURITY;

-- Service role policies
CREATE POLICY "Service role full access" ON canary_runs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON canary_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON worker_deployments
  FOR ALL USING (auth.role() = 'service_role');

-- Now create the summary view
\i canary_metrics_summary_view.sql
