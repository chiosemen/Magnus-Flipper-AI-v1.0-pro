-- =============================================================================
-- ADD search_id COLUMN TO scraped_listings
-- =============================================================================
-- PURPOSE: Fix schema drift between API code and database schema
-- CONTEXT: /api/deals queries search_id to distinguish pooled vs scoped deals
-- INVARIANT: This column does NOT reintroduce per-search scraping
--            NULL = pooled deal (default), UUID = scoped read (future use)
-- =============================================================================

-- Add search_id column (nullable, defaults to NULL for pooled deals)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'scraped_listings'
      AND column_name = 'search_id'
  ) THEN
    ALTER TABLE public.scraped_listings
    ADD COLUMN search_id UUID
    REFERENCES public.saved_searches(id)
    ON DELETE SET NULL;
  END IF;
END
$$;

-- Add index for search_id queries (pooled vs scoped reads)
CREATE INDEX IF NOT EXISTS idx_scraped_listings_search_id
ON public.scraped_listings(search_id);

-- Add partial index for pooled deals (search_id IS NULL queries)
CREATE INDEX IF NOT EXISTS idx_scraped_listings_pooled
ON public.scraped_listings(marketplace, freshness_score DESC)
WHERE search_id IS NULL;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN public.scraped_listings.search_id IS
'Optional FK to saved_searches. NULL = pooled deal (default). Non-NULL = scoped read (future use only). Does NOT drive per-search scraping.';
