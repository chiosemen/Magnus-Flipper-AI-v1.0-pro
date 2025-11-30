-- Expand marketplace_listings to support all 6 marketplaces
-- This migration adds support for FB_MARKETPLACE, CRAIGSLIST, and OFFERUP

-- Drop the existing constraint
ALTER TABLE marketplace_listings
DROP CONSTRAINT IF EXISTS marketplace_listings_marketplace_check;

-- Add new constraint with all 6 marketplaces
ALTER TABLE marketplace_listings
ADD CONSTRAINT marketplace_listings_marketplace_check
CHECK (marketplace IN ('VINTED', 'EBAY', 'GUMTREE', 'FB_MARKETPLACE', 'CRAIGSLIST', 'OFFERUP'));

-- Update table comment
COMMENT ON TABLE marketplace_listings IS 'Scraped listings from all supported marketplaces: Vinted, eBay, Gumtree, Facebook Marketplace, Craigslist, and OfferUp';

-- Update column comment
COMMENT ON COLUMN marketplace_listings.marketplace IS 'Source marketplace (VINTED, EBAY, GUMTREE, FB_MARKETPLACE, CRAIGSLIST, or OFFERUP)';
