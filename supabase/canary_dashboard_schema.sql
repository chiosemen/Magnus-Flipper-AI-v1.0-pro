-- Canary Dashboard Supabase Schema

-- Canary Metrics Table
CREATE TABLE IF NOT EXISTS canary_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name TEXT NOT NULL,
  revision TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  latency_p50 NUMERIC,
  latency_p90 NUMERIC,
  latency_p99 NUMERIC,
  ml_confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Canary Health Checks Table
CREATE TABLE IF NOT EXISTS canary_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name TEXT NOT NULL,
  revision TEXT,
  status TEXT NOT NULL CHECK (status IN ('OK', 'FAIL', 'UNKNOWN')),
  latency NUMERIC,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Canary ML Decisions Table
CREATE TABLE IF NOT EXISTS canary_ml_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name TEXT NOT NULL,
  revision TEXT,
  decision TEXT NOT NULL CHECK (decision IN ('PROMOTE', 'ROLLBACK', 'DEGRADED')),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  severity TEXT NOT NULL CHECK (severity IN ('OK', 'DEGRADED', 'CRITICAL')),
  summary TEXT,
  anomalies JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Canary Logs Table
CREATE TABLE IF NOT EXISTS canary_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name TEXT NOT NULL,
  revision TEXT,
  level TEXT DEFAULT 'INFO',
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Canary Revisions Table
CREATE TABLE IF NOT EXISTS canary_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name TEXT NOT NULL,
  stable_revision TEXT,
  canary_revision TEXT,
  traffic_split TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_canary_metrics_timestamp ON canary_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_canary_health_checks_timestamp ON canary_health_checks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_canary_ml_decisions_timestamp ON canary_ml_decisions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_canary_logs_timestamp ON canary_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_canary_logs_app_revision ON canary_logs(app_name, revision);
CREATE INDEX IF NOT EXISTS idx_canary_revisions_timestamp ON canary_revisions(timestamp DESC);

-- Row Level Security (RLS) - Enable for production
ALTER TABLE canary_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE canary_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE canary_ml_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE canary_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE canary_revisions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for background workers)
CREATE POLICY "Service role full access" ON canary_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON canary_health_checks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON canary_ml_decisions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON canary_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON canary_revisions
  FOR ALL USING (auth.role() = 'service_role');
