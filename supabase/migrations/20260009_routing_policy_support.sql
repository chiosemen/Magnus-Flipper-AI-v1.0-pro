-- =============================================================================
-- ROUTING POLICY SUPPORT MIGRATION
-- Adds tier-based routing columns for hybrid Bulldog/Apify execution
-- =============================================================================
-- IDEMPOTENT: Uses IF NOT EXISTS guards and DO blocks for safety
-- =============================================================================

-- =============================================================================
-- SAVED_SEARCHES TABLE ADDITIONS
-- =============================================================================

-- Add tier column (default: free)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'saved_searches'
      AND column_name = 'tier'
  ) THEN
    ALTER TABLE saved_searches ADD COLUMN tier TEXT DEFAULT 'free';
    COMMENT ON COLUMN saved_searches.tier IS 'User tier: free, starter, pro, elite';
  END IF;
END
$$;

-- Add cadence_seconds column (default: 600 = 10 minutes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'saved_searches'
      AND column_name = 'cadence_seconds'
  ) THEN
    ALTER TABLE saved_searches ADD COLUMN cadence_seconds INTEGER DEFAULT 600;
    COMMENT ON COLUMN saved_searches.cadence_seconds IS 'How often to run this search in seconds (e.g., 180, 300, 600, 900)';
  END IF;
END
$$;

-- Add execution_mode column (default: auto)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'saved_searches'
      AND column_name = 'execution_mode'
  ) THEN
    ALTER TABLE saved_searches ADD COLUMN execution_mode TEXT DEFAULT 'auto';
    COMMENT ON COLUMN saved_searches.execution_mode IS 'Execution mode: auto (policy-based), bulldog (force Bulldog), apify (force Apify)';
  END IF;
END
$$;

-- Add priority column (default: normal)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'saved_searches'
      AND column_name = 'priority'
  ) THEN
    ALTER TABLE saved_searches ADD COLUMN priority TEXT DEFAULT 'normal';
    COMMENT ON COLUMN saved_searches.priority IS 'Priority level: low, normal, high';
  END IF;
END
$$;

-- Add last_run_at column (nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'saved_searches'
      AND column_name = 'last_run_at'
  ) THEN
    ALTER TABLE saved_searches ADD COLUMN last_run_at TIMESTAMPTZ;
    COMMENT ON COLUMN saved_searches.last_run_at IS 'Timestamp of last scrape execution';
  END IF;
END
$$;

-- Add next_run_at column (nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'saved_searches'
      AND column_name = 'next_run_at'
  ) THEN
    ALTER TABLE saved_searches ADD COLUMN next_run_at TIMESTAMPTZ;
    COMMENT ON COLUMN saved_searches.next_run_at IS 'Timestamp of next scheduled scrape execution';
  END IF;
END
$$;

-- =============================================================================
-- SCRAPE_RUNS TABLE ADDITIONS
-- =============================================================================

-- Add engine column (nullable) - tracks which engine executed the scrape
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'scrape_runs'
      AND column_name = 'engine'
  ) THEN
    ALTER TABLE scrape_runs ADD COLUMN engine TEXT;
    COMMENT ON COLUMN scrape_runs.engine IS 'Execution engine used: bulldog or apify';
  END IF;
END
$$;

-- Note: duration_ms and error_code already exist in scrape_runs (from 20260007)
-- Verify they exist and add if missing (defensive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'scrape_runs'
      AND column_name = 'duration_ms'
  ) THEN
    ALTER TABLE scrape_runs ADD COLUMN duration_ms INTEGER;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'scrape_runs'
      AND column_name = 'error_code'
  ) THEN
    ALTER TABLE scrape_runs ADD COLUMN error_code TEXT;
  END IF;
END
$$;

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Index for scheduling queries (next_run_at)
CREATE INDEX IF NOT EXISTS idx_saved_searches_next_run_at
  ON saved_searches(next_run_at)
  WHERE active = true AND next_run_at IS NOT NULL;

-- Index for tier-based queries
CREATE INDEX IF NOT EXISTS idx_saved_searches_tier
  ON saved_searches(tier);

-- Index for engine-based analytics
CREATE INDEX IF NOT EXISTS idx_scrape_runs_engine
  ON scrape_runs(engine)
  WHERE engine IS NOT NULL;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE saved_searches IS 'User-defined saved search queries with tier-based routing support';
COMMENT ON TABLE scrape_runs IS 'Tracks marketplace scraping outcomes with engine attribution';
