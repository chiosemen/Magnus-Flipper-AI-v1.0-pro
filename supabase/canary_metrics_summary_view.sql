-- View: v_canary_metrics_summary
-- Aggregates canary metrics for the /api/canary/summary endpoint
-- This view provides a single source of truth for canary status

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

-- Grant access to service role
GRANT SELECT ON v_canary_metrics_summary TO service_role;

-- Add comment
COMMENT ON VIEW v_canary_metrics_summary IS 
  'Aggregated canary metrics summary for API consumption. Provides latest canary run, metrics, ML decisions, and deployment info per environment and worker.';
