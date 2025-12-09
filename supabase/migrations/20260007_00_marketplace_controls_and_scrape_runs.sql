-- Marketplace Controls and Scrape Runs Migration
-- Adds admin controls for marketplace scraping and observability tracking

-- =============================================================================
-- SCRAPE RUNS TABLE
-- Tracks marketplace scraping outcomes for observability
-- =============================================================================
CREATE TABLE IF NOT EXISTS scrape_runs (
  id TEXT PRIMARY KEY DEFAULT ('run_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Marketplace + user context
  marketplace TEXT NOT NULL,
  user_id UUID,
  saved_search_id UUID,
  tier TEXT,

  -- Outcome
  success BOOLEAN NOT NULL,
  duration_ms INTEGER,

  -- Error info (if any)
  error_code TEXT,
  error_message TEXT
);

-- Indexes for scrape_runs
CREATE INDEX IF NOT EXISTS idx_scrape_runs_marketplace_created_at 
  ON scrape_runs(marketplace, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_user_id_created_at 
  ON scrape_runs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_success_created_at 
  ON scrape_runs(success, created_at DESC);

-- =============================================================================
-- MARKETPLACE CONTROLS TABLE
-- Admin controls for per-marketplace behavior
-- =============================================================================
CREATE TABLE IF NOT EXISTS marketplace_controls (
  id TEXT PRIMARY KEY DEFAULT ('control_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- marketplace identifier (e.g. "ebay", "amazon", "facebook")
  marketplace TEXT NOT NULL UNIQUE,

  -- if false: worker should NOT run scrapes for this marketplace
  enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- soft cap for how many jobs can be running IN PARALLEL
  -- for this marketplace per worker instance
  max_concurrency INTEGER NOT NULL DEFAULT 5
);

-- Index for marketplace_controls
CREATE INDEX IF NOT EXISTS idx_marketplace_controls_marketplace 
  ON marketplace_controls(marketplace);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on scrape_runs
ALTER TABLE scrape_runs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on marketplace_controls
ALTER TABLE marketplace_controls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scrape_runs
-- Service role can read/write all (for workers and admin)
CREATE POLICY IF NOT EXISTS "Service role can manage scrape_runs"
  ON scrape_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can read their own scrape runs
CREATE POLICY IF NOT EXISTS "Users can read own scrape_runs"
  ON scrape_runs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for marketplace_controls
-- Service role can read/write all (for workers and admin)
CREATE POLICY IF NOT EXISTS "Service role can manage marketplace_controls"
  ON marketplace_controls
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read marketplace controls (for admin UI)
CREATE POLICY IF NOT EXISTS "Authenticated users can read marketplace_controls"
  ON marketplace_controls
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================================
-- UPDATE TRIGGER FOR updated_at
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for scrape_runs
DROP TRIGGER IF EXISTS update_scrape_runs_updated_at ON scrape_runs;
CREATE TRIGGER update_scrape_runs_updated_at
  BEFORE UPDATE ON scrape_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for marketplace_controls
DROP TRIGGER IF EXISTS update_marketplace_controls_updated_at ON marketplace_controls;
CREATE TRIGGER update_marketplace_controls_updated_at
  BEFORE UPDATE ON marketplace_controls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE scrape_runs IS 'Tracks marketplace scraping outcomes for observability and monitoring';
COMMENT ON TABLE marketplace_controls IS 'Admin controls for per-marketplace scraping behavior (enable/disable, concurrency limits)';

COMMENT ON COLUMN scrape_runs.marketplace IS 'Marketplace identifier (e.g., "ebay", "facebook", "craigslist")';
COMMENT ON COLUMN scrape_runs.success IS 'Whether the scrape completed successfully';
COMMENT ON COLUMN scrape_runs.duration_ms IS 'How long the scrape took in milliseconds';
COMMENT ON COLUMN scrape_runs.outcome IS 'Outcome type: SUCCESS, RATE_LIMIT, or ERROR';

COMMENT ON COLUMN marketplace_controls.marketplace IS 'Marketplace identifier (must match marketplace names used in scrapers)';
COMMENT ON COLUMN marketplace_controls.enabled IS 'If false, workers will skip scraping this marketplace';
COMMENT ON COLUMN marketplace_controls.max_concurrency IS 'Maximum number of concurrent scrape jobs allowed per worker instance';
