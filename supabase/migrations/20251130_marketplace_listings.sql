CREATE TABLE marketplace_listings (
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
