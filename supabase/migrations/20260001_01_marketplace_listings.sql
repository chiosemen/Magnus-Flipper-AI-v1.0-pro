-- =============================================================================
-- MARKETPLACE LISTINGS TABLE - Core table for scraped marketplace listings
-- =============================================================================
-- NOTE: This table must be created FIRST before any tables that reference it
-- =============================================================================

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace TEXT NOT NULL CHECK (marketplace IN ('VINTED', 'EBAY', 'GUMTREE')),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC,
  url TEXT NOT NULL,
  image_url TEXT,
  location TEXT,
  condition TEXT,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_marketplace_listings_marketplace_external_id
ON marketplace_listings(marketplace, external_id);

CREATE INDEX idx_marketplace_listings_created_at
ON marketplace_listings(created_at DESC);

CREATE INDEX idx_marketplace_listings_marketplace
ON marketplace_listings(marketplace);

COMMENT ON TABLE marketplace_listings IS 'Scraped listings from Vinted, eBay, and Gumtree marketplaces';

COMMENT ON COLUMN marketplace_listings.id IS 'Unique identifier for the listing record';
COMMENT ON COLUMN marketplace_listings.marketplace IS 'Source marketplace (VINTED, EBAY, or GUMTREE)';
COMMENT ON COLUMN marketplace_listings.external_id IS 'External listing ID from the marketplace';
COMMENT ON COLUMN marketplace_listings.title IS 'Listing title';
COMMENT ON COLUMN marketplace_listings.price IS 'Listing price';
COMMENT ON COLUMN marketplace_listings.url IS 'Full URL to the listing';
COMMENT ON COLUMN marketplace_listings.image_url IS 'Primary image URL';
COMMENT ON COLUMN marketplace_listings.location IS 'Seller location';
COMMENT ON COLUMN marketplace_listings.condition IS 'Item condition';
COMMENT ON COLUMN marketplace_listings.posted_at IS 'Timestamp when listing was posted on marketplace';
COMMENT ON COLUMN marketplace_listings.created_at IS 'Timestamp when listing was scraped and stored';

-- =============================================================================
-- PRICE HISTORY TABLE - Track price changes over time
-- =============================================================================
-- NOTE: Created AFTER marketplace_listings because it references it
-- =============================================================================

CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  marketplace TEXT NOT NULL CHECK (marketplace IN ('VINTED', 'EBAY', 'GUMTREE', 'FB_MARKETPLACE', 'CRAIGSLIST', 'OFFERUP')),
  external_id TEXT NOT NULL,
  price NUMERIC NOT NULL,
  price_change NUMERIC, -- Difference from previous price
  price_change_percent NUMERIC, -- Percentage change from previous price
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for price_history (created here, but additional indexes may be added in later migrations)
CREATE INDEX IF NOT EXISTS idx_price_history_listing_id ON price_history(listing_id);
CREATE INDEX IF NOT EXISTS idx_price_history_marketplace_external_id ON price_history(marketplace, external_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at DESC);

COMMENT ON TABLE price_history IS 'Historical price tracking for marketplace listings';
COMMENT ON COLUMN price_history.price_change IS 'Absolute price difference from previous record';
COMMENT ON COLUMN price_history.price_change_percent IS 'Percentage price change from previous record';
