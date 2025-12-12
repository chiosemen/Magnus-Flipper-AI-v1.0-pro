-- Analytics Enhancements Migration
-- Adds tables for performance tracking, conversion metrics, and analytics views
-- NOTE: price_history table is already created in 20260001_01_marketplace_listings.sql

-- =============================================================================
-- 1. PRICE HISTORY INDEXES (if not already created)
-- =============================================================================
-- These indexes may already exist from 20260001, but we ensure they exist here
CREATE INDEX IF NOT EXISTS idx_price_history_listing_id ON price_history(listing_id);
CREATE INDEX IF NOT EXISTS idx_price_history_marketplace_external_id ON price_history(marketplace, external_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at DESC);

-- =============================================================================
-- 2. SEARCH PERFORMANCE TABLE - Track search execution metrics
-- =============================================================================
CREATE TABLE IF NOT EXISTS search_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id UUID REFERENCES saved_searches(id) ON DELETE CASCADE,
  marketplace TEXT NOT NULL CHECK (marketplace IN ('VINTED', 'EBAY', 'GUMTREE', 'FB_MARKETPLACE', 'CRAIGSLIST', 'OFFERUP')),
  execution_time_ms INTEGER NOT NULL, -- Query execution time in milliseconds
  results_count INTEGER NOT NULL DEFAULT 0, -- Number of results returned
  new_results_count INTEGER NOT NULL DEFAULT 0, -- Number of new results
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_performance_saved_search_id ON search_performance(saved_search_id);
CREATE INDEX idx_search_performance_marketplace ON search_performance(marketplace);
CREATE INDEX idx_search_performance_executed_at ON search_performance(executed_at DESC);
CREATE INDEX idx_search_performance_success ON search_performance(success);

COMMENT ON TABLE search_performance IS 'Performance metrics for saved search executions';
COMMENT ON COLUMN search_performance.execution_time_ms IS 'Time taken to execute the search in milliseconds';

-- =============================================================================
-- 3. CONVERSION METRICS TABLE - Track user actions on listings
-- =============================================================================
CREATE TABLE IF NOT EXISTS conversion_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  saved_search_id UUID REFERENCES saved_searches(id) ON DELETE SET NULL,
  marketplace TEXT NOT NULL CHECK (marketplace IN ('VINTED', 'EBAY', 'GUMTREE', 'FB_MARKETPLACE', 'CRAIGSLIST', 'OFFERUP')),
  action_type TEXT NOT NULL CHECK (action_type IN ('VIEW', 'CLICK', 'FAVORITE', 'CONTACT', 'PURCHASE')),
  action_metadata JSONB, -- Additional action-specific data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversion_metrics_user_id ON conversion_metrics(user_id);
CREATE INDEX idx_conversion_metrics_listing_id ON conversion_metrics(listing_id);
CREATE INDEX idx_conversion_metrics_saved_search_id ON conversion_metrics(saved_search_id);
CREATE INDEX idx_conversion_metrics_marketplace ON conversion_metrics(marketplace);
CREATE INDEX idx_conversion_metrics_action_type ON conversion_metrics(action_type);
CREATE INDEX idx_conversion_metrics_created_at ON conversion_metrics(created_at DESC);

COMMENT ON TABLE conversion_metrics IS 'User interaction and conversion tracking for listings';
COMMENT ON COLUMN conversion_metrics.action_type IS 'Type of action: VIEW, CLICK, FAVORITE, CONTACT, or PURCHASE';

-- =============================================================================
-- 4. MARKETPLACE HEALTH TABLE - Track overall marketplace health metrics
-- =============================================================================
CREATE TABLE IF NOT EXISTS marketplace_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace TEXT NOT NULL CHECK (marketplace IN ('VINTED', 'EBAY', 'GUMTREE', 'FB_MARKETPLACE', 'CRAIGSLIST', 'OFFERUP')),
  total_listings INTEGER NOT NULL DEFAULT 0,
  new_listings_24h INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER, -- Average API/scraper response time
  success_rate NUMERIC, -- Success rate percentage (0-100)
  error_count INTEGER NOT NULL DEFAULT 0,
  last_successful_crawl TIMESTAMPTZ,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_marketplace_health_marketplace_date ON marketplace_health(marketplace, snapshot_date);
CREATE INDEX idx_marketplace_health_marketplace ON marketplace_health(marketplace);
CREATE INDEX idx_marketplace_health_snapshot_date ON marketplace_health(snapshot_date DESC);

COMMENT ON TABLE marketplace_health IS 'Daily health metrics snapshot for each marketplace';
COMMENT ON COLUMN marketplace_health.success_rate IS 'Percentage of successful crawls (0-100)';

-- =============================================================================
-- 5. REAL-TIME ACTIVITY FEED TABLE - For live dashboard updates
-- =============================================================================
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('NEW_LISTING', 'PRICE_DROP', 'PRICE_INCREASE', 'SEARCH_MATCH', 'ALERT_TRIGGERED', 'CRAWLER_ERROR')),
  marketplace TEXT NOT NULL CHECK (marketplace IN ('VINTED', 'EBAY', 'GUMTREE', 'FB_MARKETPLACE', 'CRAIGSLIST', 'OFFERUP')),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  saved_search_id UUID REFERENCES saved_searches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB, -- Additional activity-specific data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_feed_activity_type ON activity_feed(activity_type);
CREATE INDEX idx_activity_feed_marketplace ON activity_feed(marketplace);
CREATE INDEX idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX idx_activity_feed_created_at ON activity_feed(created_at DESC);

-- Note: TTL cleanup is handled by worker-based background task, not via index
-- The worker task runs periodically to delete records older than 30 days
-- This keeps the feed table lean for real-time queries

COMMENT ON TABLE activity_feed IS 'Real-time activity feed for dashboard updates (30-day retention)';
COMMENT ON COLUMN activity_feed.activity_type IS 'Type of activity event';

-- =============================================================================
-- 6. ANALYTICS VIEWS - Pre-computed views for faster queries
-- =============================================================================

-- Price Trend Summary View
-- Uses CTE to separate window functions from aggregates (PostgreSQL requires this when mixing window functions with GROUP BY)
CREATE OR REPLACE VIEW price_trends_summary AS
WITH price_window AS (
  SELECT
    ph.marketplace,
    ph.external_id,
    ml.title,
    ml.url,
    ph.price,
    ph.recorded_at,
    FIRST_VALUE(ph.price) OVER (
      PARTITION BY ph.marketplace, ph.external_id
      ORDER BY ph.recorded_at DESC
    ) AS current_price,
    FIRST_VALUE(ph.price) OVER (
      PARTITION BY ph.marketplace, ph.external_id
      ORDER BY ph.recorded_at ASC
    ) AS initial_price
  FROM price_history ph
  JOIN marketplace_listings ml ON ph.listing_id = ml.id
)
SELECT
  marketplace,
  external_id,
  title,
  url,
  COUNT(*) AS price_changes_count,
  MIN(price) AS lowest_price,
  MAX(price) AS highest_price,
  MAX(current_price) AS current_price,
  MIN(initial_price) AS initial_price,
  (MAX(current_price) - MIN(initial_price)) AS total_price_change,
  MIN(recorded_at) AS first_seen,
  MAX(recorded_at) AS last_seen
FROM price_window
GROUP BY marketplace, external_id, title, url;

COMMENT ON VIEW price_trends_summary IS 'Aggregated price trend data per listing';

-- Marketplace Performance Comparison View
CREATE OR REPLACE VIEW marketplace_performance_comparison AS
SELECT
  sp.marketplace,
  COUNT(*) as total_searches,
  AVG(sp.execution_time_ms) as avg_execution_time_ms,
  AVG(sp.results_count) as avg_results_count,
  SUM(sp.results_count) as total_results,
  SUM(sp.new_results_count) as total_new_results,
  SUM(CASE WHEN sp.success THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100 as success_rate_percent,
  MAX(sp.executed_at) as last_execution
FROM search_performance sp
WHERE sp.executed_at > NOW() - INTERVAL '7 days'
GROUP BY sp.marketplace;

COMMENT ON VIEW marketplace_performance_comparison IS '7-day performance metrics per marketplace';

-- Conversion Funnel View
CREATE OR REPLACE VIEW conversion_funnel AS
SELECT
  cm.marketplace,
  cm.saved_search_id,
  ss.category,
  COUNT(DISTINCT CASE WHEN cm.action_type = 'VIEW' THEN cm.listing_id END) as views,
  COUNT(DISTINCT CASE WHEN cm.action_type = 'CLICK' THEN cm.listing_id END) as clicks,
  COUNT(DISTINCT CASE WHEN cm.action_type = 'FAVORITE' THEN cm.listing_id END) as favorites,
  COUNT(DISTINCT CASE WHEN cm.action_type = 'CONTACT' THEN cm.listing_id END) as contacts,
  COUNT(DISTINCT CASE WHEN cm.action_type = 'PURCHASE' THEN cm.listing_id END) as purchases,
  CASE
    WHEN COUNT(DISTINCT CASE WHEN cm.action_type = 'VIEW' THEN cm.listing_id END) > 0
    THEN COUNT(DISTINCT CASE WHEN cm.action_type = 'CLICK' THEN cm.listing_id END)::FLOAT /
         COUNT(DISTINCT CASE WHEN cm.action_type = 'VIEW' THEN cm.listing_id END) * 100
    ELSE 0
  END as click_through_rate_percent,
  CASE
    WHEN COUNT(DISTINCT CASE WHEN cm.action_type = 'CLICK' THEN cm.listing_id END) > 0
    THEN COUNT(DISTINCT CASE WHEN cm.action_type = 'PURCHASE' THEN cm.listing_id END)::FLOAT /
         COUNT(DISTINCT CASE WHEN cm.action_type = 'CLICK' THEN cm.listing_id END) * 100
    ELSE 0
  END as conversion_rate_percent
FROM conversion_metrics cm
LEFT JOIN saved_searches ss ON cm.saved_search_id = ss.id
WHERE cm.created_at > NOW() - INTERVAL '30 days'
GROUP BY cm.marketplace, cm.saved_search_id, ss.category;

COMMENT ON VIEW conversion_funnel IS '30-day conversion funnel metrics per marketplace and search';

-- =============================================================================
-- 7. FUNCTIONS - Utility functions for analytics
-- =============================================================================

-- Function to record price changes automatically
CREATE OR REPLACE FUNCTION record_price_change()
RETURNS TRIGGER AS $$
DECLARE
  prev_price NUMERIC;
  price_diff NUMERIC;
  price_pct NUMERIC;
BEGIN
  -- Get the most recent price for this listing
  SELECT price INTO prev_price
  FROM price_history
  WHERE marketplace = NEW.marketplace
    AND external_id = NEW.external_id
  ORDER BY recorded_at DESC
  LIMIT 1;

  -- Calculate price change if previous price exists
  IF prev_price IS NOT NULL AND prev_price != NEW.price THEN
    price_diff := NEW.price - prev_price;
    price_pct := ((NEW.price - prev_price) / prev_price) * 100;

    -- Insert price history record
    INSERT INTO price_history (
      listing_id,
      marketplace,
      external_id,
      price,
      price_change,
      price_change_percent
    ) VALUES (
      NEW.id,
      NEW.marketplace,
      NEW.external_id,
      NEW.price,
      price_diff,
      price_pct
    );

    -- Create activity feed entry for significant price changes (>10% drop or >20% increase)
    IF price_pct < -10 THEN
      INSERT INTO activity_feed (
        activity_type,
        marketplace,
        listing_id,
        title,
        description,
        metadata
      ) VALUES (
        'PRICE_DROP',
        NEW.marketplace,
        NEW.id,
        NEW.title,
        'Price dropped by ' || ROUND(ABS(price_pct), 2) || '%',
        jsonb_build_object(
          'old_price', prev_price,
          'new_price', NEW.price,
          'change_percent', price_pct
        )
      );
    ELSIF price_pct > 20 THEN
      INSERT INTO activity_feed (
        activity_type,
        marketplace,
        listing_id,
        title,
        description,
        metadata
      ) VALUES (
        'PRICE_INCREASE',
        NEW.marketplace,
        NEW.id,
        NEW.title,
        'Price increased by ' || ROUND(price_pct, 2) || '%',
        jsonb_build_object(
          'old_price', prev_price,
          'new_price', NEW.price,
          'change_percent', price_pct
        )
      );
    END IF;
  ELSE
    -- First price record for this listing
    INSERT INTO price_history (
      listing_id,
      marketplace,
      external_id,
      price
    ) VALUES (
      NEW.id,
      NEW.marketplace,
      NEW.external_id,
      NEW.price
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically track price changes
DROP TRIGGER IF EXISTS trigger_price_change ON marketplace_listings;
CREATE TRIGGER trigger_price_change
AFTER INSERT OR UPDATE OF price ON marketplace_listings
FOR EACH ROW
WHEN (NEW.price IS NOT NULL)
EXECUTE FUNCTION record_price_change();

COMMENT ON FUNCTION record_price_change() IS 'Automatically records price changes and creates activity feed entries for significant changes';

-- Function to clean up old activity feed entries (called by cron job)
CREATE OR REPLACE FUNCTION cleanup_old_activity_feed()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM activity_feed
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_activity_feed() IS 'Deletes activity feed entries older than 30 days';
