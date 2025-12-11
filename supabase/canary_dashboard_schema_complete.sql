-- Complete Canary Dashboard Schema
-- Run this after the base schema to add extended tables and views

-- ============================================
-- Extended Tables
-- ============================================

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

-- Extend canary_metrics table with scope field
ALTER TABLE canary_metrics 
  ADD COLUMN IF NOT EXISTS canary_run_id UUID REFERENCES canary_runs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'last_15m' CHECK (scope IN ('last_15m', 'last_60m', 'lifetime')),
  ADD COLUMN IF NOT EXISTS latency_p95_ms INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS health_pass_rate NUMERIC DEFAULT 0 CHECK (health_pass_rate >= 0 AND health_pass_rate <= 1);

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

-- Update canary_ml_decisions to include canary_run_id
ALTER TABLE canary_ml_decisions
  ADD COLUMN IF NOT EXISTS canary_run_id UUID REFERENCES canary_runs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS env TEXT CHECK (env IN ('production', 'staging', 'local')),
  ADD COLUMN IF NOT EXISTS worker_id TEXT,
  ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ DEFAULT NOW();

-- Update canary_health_checks to include env and worker_id
ALTER TABLE canary_health_checks
  ADD COLUMN IF NOT EXISTS env TEXT CHECK (env IN ('production', 'staging', 'local')),
  ADD COLUMN IF NOT EXISTS worker_id TEXT;

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_canary_runs_env_worker ON canary_runs(env, worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_canary_metrics_run_id ON canary_metrics(canary_run_id);
CREATE INDEX IF NOT EXISTS idx_canary_metrics_env_worker ON canary_metrics(env, worker_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_worker_deployments_env_worker ON worker_deployments(env, worker_id, deployed_at DESC);
CREATE INDEX IF NOT EXISTS idx_canary_ml_decisions_env_worker ON canary_ml_decisions(env, worker_id, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_canary_ml_decisions_run_id ON canary_ml_decisions(canary_run_id);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE canary_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON canary_runs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON worker_deployments
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- Summary View
-- ============================================

CREATE OR REPLACE VIEW v_canary_metrics_summary AS
WITH latest_run AS (
  SELECT DISTINCT ON (env, worker_id)
    id            AS canary_run_id,
    env,
    worker_id,
    canary_revision,
    stable_revision,
    traffic_canary,
    traffic_stable,
    created_at AS run_created_at
  FROM canary_runs
  ORDER BY env, worker_id, created_at DESC
),
metrics_15m AS (
  SELECT
    m.env,
    m.worker_id,
    m.canary_run_id,
    m.error_rate,
    m.latency_p95_ms,
    m.health_pass_rate,
    m.total_requests,
    m.error_count,
    m.measured_at
  FROM canary_metrics m
  WHERE m.scope = 'last_15m'
),
ml_latest AS (
  SELECT DISTINCT ON (env, worker_id)
    env,
    worker_id,
    canary_run_id,
    decision,
    severity,
    confidence,
    anomalies,
    analyzed_at
  FROM canary_ml_decisions
  ORDER BY env, worker_id, analyzed_at DESC
),
latest_deploy AS (
  SELECT DISTINCT ON (env, worker_id)
    env,
    worker_id,
    revision,
    deployed_at
  FROM worker_deployments
  ORDER BY env, worker_id, deployed_at DESC
)
SELECT
  r.env,
  r.worker_id,
  r.canary_run_id,
  r.canary_revision,
  r.stable_revision,
  r.traffic_canary,
  r.traffic_stable,
  m.error_rate,
  m.latency_p95_ms,
  m.health_pass_rate,
  m.total_requests,
  m.error_count,
  ml.decision,
  ml.severity,
  ml.confidence,
  ml.anomalies,
  ml.analyzed_at,
  d.deployed_at AS last_deployment_at,
  GREATEST(
    COALESCE(m.measured_at, '1970-01-01'::timestamptz),
    COALESCE(ml.analyzed_at, '1970-01-01'::timestamptz),
    COALESCE(r.run_created_at, '1970-01-01'::timestamptz)
  ) AS last_analysis_at
FROM latest_run r
LEFT JOIN metrics_15m m ON m.canary_run_id = r.canary_run_id
LEFT JOIN ml_latest ml ON ml.canary_run_id = r.canary_run_id
LEFT JOIN latest_deploy d
  ON d.env = r.env AND d.worker_id = r.worker_id;

-- Grant access
GRANT SELECT ON v_canary_metrics_summary TO service_role;

COMMENT ON VIEW v_canary_metrics_summary IS 
  'Aggregated canary metrics summary for API consumption. Provides latest canary run, metrics, ML decisions, and deployment info per environment and worker.';
