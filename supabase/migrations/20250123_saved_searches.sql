-- Migration: EWM01 - Saved Search & Alerts Feature
-- Description: Adds saved_searches, listings, and listing_matches tables for Marketplace Monitor functionality
-- Date: 2025-01-23

-- ===========================================================================
-- 1. Add expo_push_token to users table for mobile push notifications
-- ===========================================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- ===========================================================================
-- 2. saved_searches table - User's marketplace watchlists
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  name                TEXT NOT NULL,                -- "NYC iPhone 15 flips"

  category            TEXT NOT NULL,                -- "phones", "cars", etc.
  manufacturer        TEXT,                         -- "Apple"
  models              TEXT[] DEFAULT '{}',          -- ["iPhone 15 Pro Max"]

  min_price           NUMERIC,
  max_price           NUMERIC,
  radius_miles        NUMERIC,
  location_city       TEXT,
  location_lat        DOUBLE PRECISION,
  location_lng        DOUBLE PRECISION,

  conditions          TEXT[] DEFAULT '{}',          -- ["NEW","LIKE_NEW",...]
  sites               TEXT[] DEFAULT '{}',          -- ["OFFERUP","CRAIGSLIST"]

  max_results_per_run INT DEFAULT 20,
  active              BOOLEAN DEFAULT TRUE,

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  last_run_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user   ON public.saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON public.saved_searches(active);

-- ===========================================================================
-- 3. listings table - Actual scraped marketplace items
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.listings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id   TEXT NOT NULL,
  site          TEXT NOT NULL,                -- "OFFERUP","CRAIGSLIST",...

  url           TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC,
  currency      TEXT DEFAULT 'USD',

  manufacturer  TEXT,
  model         TEXT,
  condition     TEXT,                         -- "NEW","GOOD",...

  city          TEXT,
  region        TEXT,
  country       TEXT,
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,

  posted_at     TIMESTAMPTZ,
  scraped_at    TIMESTAMPTZ DEFAULT now(),

  image_urls    TEXT[],

  UNIQUE (external_id, site)
);

CREATE INDEX IF NOT EXISTS idx_listings_site        ON public.listings(site);
CREATE INDEX IF NOT EXISTS idx_listings_price       ON public.listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_location    ON public.listings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_listings_posted_at   ON public.listings(posted_at);
CREATE INDEX IF NOT EXISTS idx_listings_manufacturer ON public.listings(manufacturer);
CREATE INDEX IF NOT EXISTS idx_listings_model       ON public.listings(model);
CREATE INDEX IF NOT EXISTS idx_listings_condition   ON public.listings(condition);

-- ===========================================================================
-- 4. listing_matches table - Links saved searches to matched listings
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.listing_matches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id  UUID NOT NULL REFERENCES public.saved_searches(id) ON DELETE CASCADE,
  listing_id       UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,

  matched_at       TIMESTAMPTZ DEFAULT now(),
  notified         BOOLEAN DEFAULT FALSE,
  notified_at      TIMESTAMPTZ,

  UNIQUE(saved_search_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_matches_search   ON public.listing_matches(saved_search_id);
CREATE INDEX IF NOT EXISTS idx_listing_matches_listing  ON public.listing_matches(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_matches_notified ON public.listing_matches(notified);

-- ===========================================================================
-- 5. Foreign Key Constraints
-- ===========================================================================
ALTER TABLE public.saved_searches
  ADD CONSTRAINT fk_saved_searches_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===========================================================================
-- 6. Row Level Security (RLS) Policies
-- ===========================================================================

-- Enable RLS on new tables
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_matches ENABLE ROW LEVEL SECURITY;

-- saved_searches: Users can only see/manage their own saved searches
CREATE POLICY "Users can manage their own saved searches"
  ON public.saved_searches
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- listings: All authenticated users can read listings
CREATE POLICY "Authenticated users can read listings"
  ON public.listings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Workers can insert/update listings (via service role)
CREATE POLICY "Service role can manage listings"
  ON public.listings
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- listing_matches: Users can only see matches for their saved searches
CREATE POLICY "Users can see their own listing matches"
  ON public.listing_matches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_searches
      WHERE id = listing_matches.saved_search_id
      AND user_id = auth.uid()
    )
  );

-- Service role can create matches (for the alert worker)
CREATE POLICY "Service role can create listing matches"
  ON public.listing_matches
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Service role can update notification status
CREATE POLICY "Service role can update listing matches"
  ON public.listing_matches
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================================================
-- 7. Helper Functions (Optional but useful)
-- ===========================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saved_searches_updated_at BEFORE UPDATE
  ON public.saved_searches FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- ===========================================================================
-- 8. Comments for documentation
-- ===========================================================================
COMMENT ON TABLE public.saved_searches IS 'User-defined marketplace search criteria for automated monitoring';
COMMENT ON TABLE public.listings IS 'Scraped marketplace listings from OfferUp, Craigslist, Facebook Marketplace, etc.';
COMMENT ON TABLE public.listing_matches IS 'Join table linking saved searches to matching listings, with notification tracking';
