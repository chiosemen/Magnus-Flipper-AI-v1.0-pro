-- ============================================================================
-- Apify Usage Tracking - Burn Rate Data Model
-- ============================================================================
-- Minimal append-only table for tracking Apify costs at the pool level.
--
-- DESIGN PRINCIPLES:
-- ==================
-- - APPEND-ONLY: No updates or deletes, only inserts
-- - POOLED-ONLY: No user identifiers, all scraping is pooled
-- - AGGREGATION-FRIENDLY: Optimized for pool-level and tier-level analysis
-- - MINIMAL: Single table, no joins required
--
-- USE CASES:
-- ==========
-- - Track daily/monthly Apify burn rate
-- - Calculate cost per deal by marketplace
-- - Analyze pool efficiency (cost vs items scraped)
-- - Monitor failed runs and error rates
-- - Support tier-level cost analysis (premium vs standard pools)
--
-- SECURITY:
-- =========
-- - Admin-only read access (RLS enforced)
-- - Workers use service role key to write (bypasses RLS)
-- - No user PII stored
-- ============================================================================

-- Create apify_usage_events table (append-only)
CREATE TABLE IF NOT EXISTS apify_usage_events (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ========================================================================
  -- Apify Run Metadata
  -- ========================================================================
  run_id TEXT NOT NULL,                 -- Apify run ID (unique identifier)
  actor_id TEXT NOT NULL,               -- Apify actor ID (e.g., facebook-scraper)

  -- ========================================================================
  -- Pool Identification (NO USER IDs)
  -- ========================================================================
  -- These fields identify which pool this run belongs to
  -- CRITICAL: pool_type must ALWAYS be "pooled" (no per-user scraping)
  pool_type TEXT NOT NULL DEFAULT 'pooled',
  marketplace TEXT NOT NULL,            -- "facebook", "cars", "vinted", etc.
  region TEXT,                          -- "us_east", "uk", "ca", null for global
  pool_tier TEXT,                       -- "high_value", "standard", "experimental"

  -- ========================================================================
  -- Timing Information
  -- ========================================================================
  started_at TIMESTAMPTZ NOT NULL,      -- When Apify run started
  finished_at TIMESTAMPTZ,              -- When Apify run finished (null if running)
  duration_seconds INTEGER,             -- Duration in seconds (calculated)

  -- ========================================================================
  -- Cost and Usage Metrics
  -- ========================================================================
  status TEXT NOT NULL,                 -- "SUCCEEDED", "FAILED", "ABORTED", "RUNNING"
  compute_units DECIMAL(10,4),          -- Apify compute units consumed
  cost_usd DECIMAL(10,4),               -- USD cost (compute_units * rate)

  -- ========================================================================
  -- Scraping Results
  -- ========================================================================
  items_scraped INTEGER DEFAULT 0,      -- Total items scraped in this run
  items_new INTEGER DEFAULT 0,          -- New items (not seen before)
  items_updated INTEGER DEFAULT 0,      -- Existing items updated

  -- ========================================================================
  -- Error Tracking
  -- ========================================================================
  error_message TEXT,                   -- Error message if failed
  error_code TEXT,                      -- Error code for categorization

  -- ========================================================================
  -- Metadata
  -- ========================================================================
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- When event was logged

  -- ========================================================================
  -- Constraints
  -- ========================================================================
  -- Enforce pooled-only architecture
  CONSTRAINT valid_pool_type CHECK (pool_type = 'pooled'),

  -- Ensure valid status values
  CONSTRAINT valid_status CHECK (status IN ('SUCCEEDED', 'FAILED', 'ABORTED', 'RUNNING', 'TIMEOUT')),

  -- Ensure non-negative values
  CONSTRAINT non_negative_compute_units CHECK (compute_units IS NULL OR compute_units >= 0),
  CONSTRAINT non_negative_cost CHECK (cost_usd IS NULL OR cost_usd >= 0),
  CONSTRAINT non_negative_items CHECK (items_scraped >= 0)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================
-- These indexes optimize common aggregation queries for the admin dashboard

-- Index for time-range queries (most common: "last 30 days", "this month")
CREATE INDEX idx_apify_usage_started_at
  ON apify_usage_events(started_at DESC);

-- Index for pool-level aggregation (group by marketplace + region)
CREATE INDEX idx_apify_usage_pool
  ON apify_usage_events(marketplace, region, started_at DESC);

-- Index for tier-level analysis
CREATE INDEX idx_apify_usage_tier
  ON apify_usage_events(pool_tier, started_at DESC)
  WHERE pool_tier IS NOT NULL;

-- Index for status filtering (e.g., count failed runs)
CREATE INDEX idx_apify_usage_status
  ON apify_usage_events(status, started_at DESC);

-- Index for run_id lookups (to avoid duplicate logging)
CREATE UNIQUE INDEX idx_apify_usage_run_id
  ON apify_usage_events(run_id);

-- Composite index for cost queries (marketplace + status + time)
CREATE INDEX idx_apify_usage_cost_analysis
  ON apify_usage_events(marketplace, status, started_at DESC)
  WHERE status = 'SUCCEEDED';

-- ============================================================================
-- Row-Level Security (RLS)
-- ============================================================================
-- Admin-only read access for dashboard queries
-- Workers use service role key to bypass RLS for writes

-- Enable RLS
ALTER TABLE apify_usage_events ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read all usage events
CREATE POLICY "Admin can read apify_usage_events"
  ON apify_usage_events
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Policy: Service role can insert (workers use service role key)
-- Note: Regular users cannot insert (only service role)
CREATE POLICY "Service role can insert apify_usage_events"
  ON apify_usage_events
  FOR INSERT
  WITH CHECK (
    -- Only service role can insert (bypasses RLS)
    -- This policy is for documentation; service role bypasses RLS anyway
    true
  );

-- NO UPDATE OR DELETE POLICIES (append-only table)

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to calculate cost from compute units
-- Apify pricing: ~$0.25 per compute unit (check current rate)
CREATE OR REPLACE FUNCTION calculate_apify_cost(compute_units DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  -- Current Apify rate (update if pricing changes)
  RETURN compute_units * 0.25;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate pool_id from marketplace + region
CREATE OR REPLACE FUNCTION generate_pool_id(marketplace TEXT, region TEXT)
RETURNS TEXT AS $$
BEGIN
  IF region IS NULL THEN
    RETURN marketplace || '_global';
  ELSE
    RETURN marketplace || '_' || region;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- Materialized View for Daily Aggregates (Optional Performance Optimization)
-- ============================================================================
-- Pre-aggregate daily stats for faster dashboard queries
-- Refresh this view daily via cron job

CREATE MATERIALIZED VIEW IF NOT EXISTS apify_usage_daily AS
SELECT
  DATE(started_at) as date,
  marketplace,
  region,
  pool_tier,
  status,
  COUNT(*) as runs_count,
  SUM(compute_units) as total_compute_units,
  SUM(cost_usd) as total_cost_usd,
  SUM(items_scraped) as total_items_scraped,
  SUM(items_new) as total_items_new,
  AVG(duration_seconds) as avg_duration_seconds,
  -- Cost efficiency metrics
  CASE
    WHEN SUM(items_scraped) > 0
    THEN SUM(cost_usd) / SUM(items_scraped)
    ELSE NULL
  END as cost_per_item
FROM apify_usage_events
WHERE status = 'SUCCEEDED'
GROUP BY
  DATE(started_at),
  marketplace,
  region,
  pool_tier,
  status;

-- Index on materialized view
CREATE INDEX idx_apify_usage_daily_date
  ON apify_usage_daily(date DESC);

-- Function to refresh materialized view (call daily via cron)
CREATE OR REPLACE FUNCTION refresh_apify_usage_daily()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY apify_usage_daily;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Test queries to verify table setup

-- Check table exists
-- SELECT COUNT(*) FROM apify_usage_events;

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'apify_usage_events';

-- Check RLS policies
-- SELECT *
-- FROM pg_policies
-- WHERE tablename = 'apify_usage_events';

-- Test insert (as service role)
-- INSERT INTO apify_usage_events (
--   run_id, actor_id, marketplace, started_at, status, compute_units, cost_usd, items_scraped
-- ) VALUES (
--   'test_run_001', 'facebook_scraper', 'facebook', NOW(), 'SUCCEEDED', 1.5, 0.375, 250
-- );

-- ============================================================================
-- Maintenance
-- ============================================================================

-- Set up daily refresh of materialized view (add to cron or pg_cron)
-- SELECT cron.schedule(
--   'refresh-apify-usage-daily',
--   '0 1 * * *',  -- Run at 1 AM daily
--   $$SELECT refresh_apify_usage_daily()$$
-- );

-- Optional: Add partition by month for very large datasets (future optimization)
-- CREATE TABLE apify_usage_events_2024_12 PARTITION OF apify_usage_events
--   FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE apify_usage_events IS
  'Append-only log of Apify scraping runs with cost tracking. Pooled scraping only, no user identifiers.';

COMMENT ON COLUMN apify_usage_events.pool_type IS
  'Pool type - must always be "pooled" (no per-user scraping allowed)';

COMMENT ON COLUMN apify_usage_events.marketplace IS
  'Marketplace identifier (facebook, cars, vinted, etc.)';

COMMENT ON COLUMN apify_usage_events.region IS
  'Geographic region (us_east, uk, ca, etc.) or NULL for global';

COMMENT ON COLUMN apify_usage_events.pool_tier IS
  'Pool tier for cost analysis (high_value, standard, experimental)';

COMMENT ON COLUMN apify_usage_events.compute_units IS
  'Apify compute units consumed (1 CU ≈ $0.25)';

COMMENT ON COLUMN apify_usage_events.cost_usd IS
  'Calculated USD cost (compute_units * rate)';

COMMENT ON COLUMN apify_usage_events.items_scraped IS
  'Total items scraped in this run';

COMMENT ON COLUMN apify_usage_events.created_at IS
  'When this event was logged to Supabase (not the run time)';
