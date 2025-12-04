-- Migration: Worker Tables for Listings and Scanner Logs
-- Description: Creates tables for storing raw marketplace listings and scanner activity logs

-- ============================================================================
-- 1. LISTINGS_RAW TABLE
-- ============================================================================
-- Stores raw scraped listings from all marketplaces
CREATE TABLE IF NOT EXISTS listings_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace TEXT NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC(10, 2),
  url TEXT NOT NULL,
  image_url TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_listings_raw_marketplace ON listings_raw(marketplace);
CREATE INDEX IF NOT EXISTS idx_listings_raw_captured_at ON listings_raw(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_raw_posted_at ON listings_raw(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_raw_price ON listings_raw(price);
CREATE INDEX IF NOT EXISTS idx_listings_raw_metadata ON listings_raw USING GIN (metadata);

-- Full-text search index for title
CREATE INDEX IF NOT EXISTS idx_listings_raw_title_search ON listings_raw USING GIN (to_tsvector('english', title));

-- ============================================================================
-- 2. SCANNER_LOGS TABLE (if not already created in 0002)
-- ============================================================================
-- Additional detailed logs for scanner operations (optional, complementary to scanner_telemetry)
CREATE TABLE IF NOT EXISTS scanner_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace TEXT NOT NULL,
  log_level TEXT NOT NULL CHECK (log_level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scanner_logs_marketplace ON scanner_logs(marketplace);
CREATE INDEX IF NOT EXISTS idx_scanner_logs_created_at ON scanner_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scanner_logs_log_level ON scanner_logs(log_level);

-- ============================================================================
-- 3. LISTING ANALYTICS TABLE
-- ============================================================================
-- Aggregated analytics for listings per marketplace
CREATE TABLE IF NOT EXISTS listing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace TEXT NOT NULL,
  date DATE NOT NULL,
  total_listings INTEGER DEFAULT 0,
  avg_price NUMERIC(10, 2),
  min_price NUMERIC(10, 2),
  max_price NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(marketplace, date)
);

CREATE INDEX IF NOT EXISTS idx_listing_analytics_marketplace ON listing_analytics(marketplace);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_date ON listing_analytics(date DESC);

-- ============================================================================
-- 4. TRIGGERS FOR ANALYTICS
-- ============================================================================
-- Automatically update analytics when new listings are captured
CREATE OR REPLACE FUNCTION update_listing_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO listing_analytics (marketplace, date, total_listings, avg_price, min_price, max_price)
  SELECT
    NEW.marketplace,
    CURRENT_DATE,
    COUNT(*),
    AVG(price),
    MIN(price),
    MAX(price)
  FROM listings_raw
  WHERE marketplace = NEW.marketplace
    AND captured_at::date = CURRENT_DATE
  ON CONFLICT (marketplace, date)
  DO UPDATE SET
    total_listings = EXCLUDED.total_listings,
    avg_price = EXCLUDED.avg_price,
    min_price = EXCLUDED.min_price,
    max_price = EXCLUDED.max_price;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_listing_analytics
AFTER INSERT ON listings_raw
FOR EACH ROW
EXECUTE FUNCTION update_listing_analytics();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS for listings_raw
ALTER TABLE listings_raw ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role full access on listings_raw"
ON listings_raw
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users can read listings
CREATE POLICY "Authenticated users can read listings_raw"
ON listings_raw
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS for scanner_logs
ALTER TABLE scanner_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role full access on scanner_logs
CREATE POLICY "Service role full access on scanner_logs"
ON scanner_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Admin users can read scanner_logs
CREATE POLICY "Admin users can read scanner_logs"
ON scanner_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.subscription_tier = 'ADMIN'
  )
);

-- Enable RLS for listing_analytics
ALTER TABLE listing_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Service role full access on listing_analytics
CREATE POLICY "Service role full access on listing_analytics"
ON listing_analytics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users can read analytics
CREATE POLICY "Authenticated users can read listing_analytics"
ON listing_analytics
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================
-- Function to clean up old listings (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_listings()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM listings_raw
  WHERE captured_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get marketplace stats
CREATE OR REPLACE FUNCTION get_marketplace_stats(marketplace_name TEXT)
RETURNS TABLE(
  total_listings BIGINT,
  avg_price NUMERIC,
  latest_capture TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    AVG(price)::NUMERIC(10,2),
    MAX(captured_at)
  FROM listings_raw
  WHERE marketplace = marketplace_name
    AND captured_at > NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================
COMMENT ON TABLE listings_raw IS 'Raw marketplace listings scraped by workers';
COMMENT ON TABLE scanner_logs IS 'Detailed logs from marketplace scanners';
COMMENT ON TABLE listing_analytics IS 'Daily aggregated analytics per marketplace';
COMMENT ON FUNCTION cleanup_old_listings IS 'Removes listings older than 30 days';
COMMENT ON FUNCTION get_marketplace_stats IS 'Returns statistics for a specific marketplace';
