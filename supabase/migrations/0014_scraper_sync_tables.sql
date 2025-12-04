-- Phase 14: Live Marketplace Scraper Synchronization Engine
-- Scraped listings, deduplication, telemetry, and health monitoring

-- =============================================================================
-- SCRAPED LISTINGS TABLE
-- Stores all scraped marketplace listings with normalization
-- =============================================================================
CREATE TABLE IF NOT EXISTS scraped_listings (
  id TEXT PRIMARY KEY DEFAULT ('listing_' || gen_random_uuid()::text),

  -- Core fields
  title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  normalized_price NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  link TEXT NOT NULL UNIQUE,
  images TEXT[],

  -- Seller information
  seller_id TEXT NOT NULL,
  seller_name TEXT,
  seller_rating NUMERIC(3, 2),
  seller_reviews_count INTEGER,

  -- Metadata
  marketplace TEXT NOT NULL,
  category TEXT,
  condition TEXT,
  normalized_condition TEXT,
  location TEXT,
  description TEXT,

  -- Shipping
  shipping_available BOOLEAN DEFAULT FALSE,
  shipping_cost NUMERIC(10, 2),

  -- Engagement
  views_count INTEGER,

  -- Deduplication
  content_hash TEXT NOT NULL,
  duplicate_group_id TEXT,

  -- Freshness
  freshness_score INTEGER DEFAULT 100,
  first_seen_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  is_stale BOOLEAN DEFAULT FALSE,

  -- Anomaly detection
  is_anomaly BOOLEAN DEFAULT FALSE,
  anomaly_reason TEXT,
  anomaly_score NUMERIC(10, 2),

  -- Raw data
  raw_data JSONB,

  -- Timestamps
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_scraped_listings_marketplace ON scraped_listings(marketplace);
CREATE INDEX idx_scraped_listings_freshness ON scraped_listings(freshness_score DESC);
CREATE INDEX idx_scraped_listings_content_hash ON scraped_listings(content_hash);
CREATE INDEX idx_scraped_listings_duplicate_group ON scraped_listings(duplicate_group_id) WHERE duplicate_group_id IS NOT NULL;
CREATE INDEX idx_scraped_listings_anomaly ON scraped_listings(is_anomaly) WHERE is_anomaly = TRUE;
CREATE INDEX idx_scraped_listings_last_seen ON scraped_listings(last_seen_at DESC);
CREATE INDEX idx_scraped_listings_normalized_price ON scraped_listings(normalized_price);
CREATE INDEX idx_scraped_listings_seller ON scraped_listings(seller_id);
CREATE INDEX idx_scraped_listings_category ON scraped_listings(category);

-- Full-text search on normalized title
CREATE INDEX idx_scraped_listings_title_search ON scraped_listings USING gin(to_tsvector('english', normalized_title));

-- =============================================================================
-- SCRAPER HEALTH TABLE
-- Tracks health metrics for each marketplace scraper
-- =============================================================================
CREATE TABLE IF NOT EXISTS scraper_health (
  id SERIAL PRIMARY KEY,
  marketplace TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),

  -- Timing
  last_run_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,

  -- Statistics
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  avg_items_per_run INTEGER DEFAULT 0,
  avg_duration_ms INTEGER DEFAULT 0,
  error_rate NUMERIC(5, 2) DEFAULT 0,

  -- Error tracking
  last_error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scraper_health_status ON scraper_health(status);
CREATE INDEX idx_scraper_health_last_run ON scraper_health(last_run_at DESC);

-- =============================================================================
-- SCRAPER LOGS TABLE
-- Detailed logs of each scraper execution
-- =============================================================================
CREATE TABLE IF NOT EXISTS scraper_logs (
  id SERIAL PRIMARY KEY,
  marketplace TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  duration_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  total_scraped INTEGER DEFAULT 0,
  errors TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scraper_logs_marketplace ON scraper_logs(marketplace);
CREATE INDEX idx_scraper_logs_started_at ON scraper_logs(started_at DESC);
CREATE INDEX idx_scraper_logs_success ON scraper_logs(success);

-- =============================================================================
-- SCRAPER CONFIGS TABLE
-- User-specific scraper configurations
-- =============================================================================
CREATE TABLE IF NOT EXISTS scraper_configs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,

  -- Search configuration
  search_queries TEXT[] NOT NULL,
  location TEXT,
  max_price NUMERIC(10, 2),
  min_price NUMERIC(10, 2),
  categories TEXT[],

  -- Scraper settings
  max_pages INTEGER DEFAULT 3,
  delay_min_ms INTEGER DEFAULT 2000,
  delay_max_ms INTEGER DEFAULT 5000,
  use_proxy BOOLEAN DEFAULT FALSE,
  headless BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, marketplace)
);

CREATE INDEX idx_scraper_configs_user ON scraper_configs(user_id);
CREATE INDEX idx_scraper_configs_marketplace ON scraper_configs(marketplace);
CREATE INDEX idx_scraper_configs_enabled ON scraper_configs(enabled);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE scraped_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_configs ENABLE ROW LEVEL SECURITY;

-- Scraped Listings: Public read access for searching
CREATE POLICY "Anyone can view scraped listings"
  ON scraped_listings FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage scraped listings"
  ON scraped_listings FOR ALL
  USING (true);

-- Scraper Health: Public read access
CREATE POLICY "Anyone can view scraper health"
  ON scraper_health FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage scraper health"
  ON scraper_health FOR ALL
  USING (true);

-- Scraper Logs: Service role only
CREATE POLICY "Service role can manage scraper logs"
  ON scraper_logs FOR ALL
  USING (true);

-- Scraper Configs: Users manage their own configs
CREATE POLICY "Users can view their own scraper configs"
  ON scraper_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own scraper configs"
  ON scraper_configs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all scraper configs"
  ON scraper_configs FOR ALL
  USING (true);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Update timestamp trigger
CREATE TRIGGER scraped_listings_updated_at
  BEFORE UPDATE ON scraped_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER scraper_configs_updated_at
  BEFORE UPDATE ON scraper_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER scraper_health_updated_at
  BEFORE UPDATE ON scraper_health
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Fresh listings view (high freshness score)
CREATE OR REPLACE VIEW fresh_listings AS
SELECT
  id,
  marketplace,
  title,
  normalized_price,
  link,
  images,
  freshness_score,
  first_seen_at,
  last_seen_at
FROM scraped_listings
WHERE freshness_score >= 70
  AND is_stale = FALSE
ORDER BY freshness_score DESC, first_seen_at DESC;

GRANT SELECT ON fresh_listings TO authenticated, anon;

-- Duplicate groups view
CREATE OR REPLACE VIEW duplicate_groups AS
SELECT
  duplicate_group_id,
  COUNT(*) as count,
  array_agg(marketplace) as marketplaces,
  array_agg(link) as links,
  MIN(normalized_price) as min_price,
  MAX(normalized_price) as max_price
FROM scraped_listings
WHERE duplicate_group_id IS NOT NULL
GROUP BY duplicate_group_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

GRANT SELECT ON duplicate_groups TO authenticated, anon;

-- Anomaly summary view
CREATE OR REPLACE VIEW anomaly_summary AS
SELECT
  marketplace,
  COUNT(*) as anomaly_count,
  AVG(anomaly_score) as avg_anomaly_score,
  array_agg(DISTINCT anomaly_reason) as reasons
FROM scraped_listings
WHERE is_anomaly = TRUE
GROUP BY marketplace
ORDER BY anomaly_count DESC;

GRANT SELECT ON anomaly_summary TO authenticated, anon;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE scraped_listings IS 'Live marketplace listings from scrapers with normalization and deduplication';
COMMENT ON TABLE scraper_health IS 'Health metrics for marketplace scrapers';
COMMENT ON TABLE scraper_logs IS 'Detailed execution logs for each scraper run';
COMMENT ON TABLE scraper_configs IS 'User-specific scraper configurations';

COMMENT ON COLUMN scraped_listings.content_hash IS 'SHA-256 hash for deduplication based on title+price+marketplace';
COMMENT ON COLUMN scraped_listings.freshness_score IS 'Score 0-100 based on recency (exponential decay)';
COMMENT ON COLUMN scraped_listings.is_anomaly IS 'Flag for listings with suspicious patterns (low price, missing images, etc.)';
