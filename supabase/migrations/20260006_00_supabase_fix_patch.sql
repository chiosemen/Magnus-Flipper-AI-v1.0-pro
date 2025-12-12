-- =============================================================================
-- PHASE 11D - SUPABASE FIX PATCH
-- =============================================================================
-- This migration fixes issues identified in Phase 11C verification:
-- 1. Removes non-immutable TTL index
-- 2. Enables RLS for marketplace_listings and price_history
-- 3. Adds secure default RLS policies
-- =============================================================================
-- SAFETY: This migration is non-destructive, idempotent, and forward-compatible
-- =============================================================================

-- =============================================================================
-- 1. FIX TTL INDEX ERROR (Non-Immutable Index)
-- =============================================================================
-- Problem: Postgres prohibits using NOW() in index predicates (not immutable)
-- Solution: Remove the faulty index. Cleanup is handled by scheduled function.
-- =============================================================================

DROP INDEX IF EXISTS idx_activity_feed_created_at_ttl;

-- Note: TTL cleanup is handled by worker-based background task (worker-scheduler)
-- The worker runs periodically to delete records older than 30 days
-- No index needed for this - standard index on created_at exists for query performance

-- =============================================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- =============================================================================
-- Enable RLS on marketplace_listings and price_history tables
-- Note: Using DO block to check table existence first (defensive migration)
-- =============================================================================

DO $$
BEGIN
  -- Enable RLS on marketplace_listings if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'marketplace_listings'
  ) THEN
    ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS on price_history if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'price_history'
  ) THEN
    ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =============================================================================
-- 3. ADD SECURE DEFAULT POLICIES
-- =============================================================================
-- Note: marketplace_listings does not have a user_id column (it stores
-- scraped listings from external marketplaces, not user-owned listings).
-- Therefore, policies are based on authenticated access rather than ownership.
-- =============================================================================

DO $$
BEGIN
  -- =============================================================================
  -- MARKETPLACE_LISTINGS POLICIES (only if table exists)
  -- =============================================================================
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'marketplace_listings'
  ) THEN
    -- Drop existing policies if they exist (idempotent)
    DROP POLICY IF EXISTS "Authenticated users can view marketplace listings" ON marketplace_listings;
    DROP POLICY IF EXISTS "Service role full access to marketplace listings" ON marketplace_listings;
    DROP POLICY IF EXISTS "Authenticated users can insert marketplace listings" ON marketplace_listings;
    DROP POLICY IF EXISTS "Service role can update marketplace listings" ON marketplace_listings;
    DROP POLICY IF EXISTS "Service role can delete marketplace listings" ON marketplace_listings;

    -- Authenticated users can view all scraped listings
    -- (These are public marketplace listings, not user-owned)
    CREATE POLICY "Authenticated users can view marketplace listings"
      ON marketplace_listings FOR SELECT
      USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

    -- Service role has full access (for scrapers and admin operations)
    CREATE POLICY "Service role full access to marketplace listings"
      ON marketplace_listings FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');

    -- Authenticated users can insert (for scrapers)
    CREATE POLICY "Authenticated users can insert marketplace listings"
      ON marketplace_listings FOR INSERT
      WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

    -- Service role can update/delete (for cleanup and corrections)
    CREATE POLICY "Service role can update marketplace listings"
      ON marketplace_listings FOR UPDATE
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');

    CREATE POLICY "Service role can delete marketplace listings"
      ON marketplace_listings FOR DELETE
      USING (auth.role() = 'service_role');
  END IF;

  -- =============================================================================
  -- PRICE_HISTORY POLICIES (only if table exists)
  -- =============================================================================
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'price_history'
  ) THEN
    -- Drop existing policies if they exist (idempotent)
    DROP POLICY IF EXISTS "Authenticated users can view price history" ON price_history;
    DROP POLICY IF EXISTS "Service role full access to price history" ON price_history;
    DROP POLICY IF EXISTS "Authenticated users can insert price history" ON price_history;
    DROP POLICY IF EXISTS "Service role can update price history" ON price_history;
    DROP POLICY IF EXISTS "Service role can delete price history" ON price_history;

    -- Users can view price history for listings they can see
    -- (Price history is linked to marketplace_listings via listing_id)
    CREATE POLICY "Authenticated users can view price history"
      ON price_history FOR SELECT
      USING (
        auth.role() = 'authenticated' OR auth.role() = 'service_role'
      );

    -- Service role has full access (for price tracking and admin operations)
    CREATE POLICY "Service role full access to price history"
      ON price_history FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');

    -- Authenticated users can insert price history (for scrapers)
    CREATE POLICY "Authenticated users can insert price history"
      ON price_history FOR INSERT
      WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

    -- Service role can update/delete (for corrections)
    CREATE POLICY "Service role can update price history"
      ON price_history FOR UPDATE
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');

    CREATE POLICY "Service role can delete price history"
      ON price_history FOR DELETE
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Summary:
-- ✅ TTL index removed (cleanup handled by function)
-- ✅ RLS enabled on marketplace_listings and price_history
-- ✅ Secure policies applied (authenticated read, service role full access)
-- =============================================================================

