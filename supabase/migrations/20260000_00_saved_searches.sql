-- =============================================================================
-- SAVED SEARCHES TABLE - User-defined search queries
-- =============================================================================
-- NOTE: This table must be created BEFORE 20260004 which references it
-- =============================================================================

CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  keywords TEXT[],
  min_price NUMERIC,
  max_price NUMERIC,
  marketplaces TEXT[] CHECK (array_length(marketplaces, 1) > 0),
  location TEXT,
  condition TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_updated_at ON saved_searches(updated_at DESC);

-- Enable RLS
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own saved searches"
  ON saved_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches"
  ON saved_searches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches"
  ON saved_searches FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE saved_searches IS 'User-defined saved search queries for marketplace listings';
COMMENT ON COLUMN saved_searches.marketplaces IS 'Array of marketplace names to search (VINTED, EBAY, GUMTREE, etc)';
COMMENT ON COLUMN saved_searches.keywords IS 'Array of search keywords';
COMMENT ON COLUMN saved_searches.active IS 'Whether this search is currently active and should be run automatically';

