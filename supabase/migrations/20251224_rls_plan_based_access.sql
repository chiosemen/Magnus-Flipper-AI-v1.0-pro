-- ============================================================================
-- Migration: RLS Policies for Plan-Based and Admin Access Control
-- Date: 2025-12-24
-- Purpose: Enforce plan-based feature access and admin-only table protection
-- ============================================================================

-- ============================================================================
-- EXAMPLE: Plan-gated table (saved_searches)
-- ============================================================================
-- This demonstrates how to restrict inserts based on user's plan
-- Adapt this pattern for other plan-gated features

-- Ensure RLS is enabled on saved_searches
ALTER TABLE IF EXISTS public.saved_searches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (idempotent migration)
DROP POLICY IF EXISTS "Users can view own saved searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Users can insert own saved searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Users can update own saved searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Users can delete own saved searches" ON public.saved_searches;

-- Policy: Users can view their own saved searches
CREATE POLICY "Users can view own saved searches"
    ON public.saved_searches
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert saved searches (plan restrictions can be added)
-- Example: Limit free users to 3 saved searches (enforce in app logic or here)
CREATE POLICY "Users can insert own saved searches"
    ON public.saved_searches
    FOR INSERT
    WITH CHECK (
      auth.uid() = user_id
      -- Optional: Add plan-based limits
      -- AND (
      --   SELECT plan_rank(plan) >= plan_rank('free')
      --   FROM public.profiles
      --   WHERE id = auth.uid()
      -- )
    );

-- Policy: Users can update their own saved searches
CREATE POLICY "Users can update own saved searches"
    ON public.saved_searches
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own saved searches
CREATE POLICY "Users can delete own saved searches"
    ON public.saved_searches
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- EXAMPLE: Admin-only table policies
-- ============================================================================
-- Pattern for tables that should only be accessible to admins
-- Apply this to: marketplace_controls, scraper_health, etc.

-- Helper function: Check if current user is admin
-- (Reusable across multiple RLS policies)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = true
      AND role = 'admin'
  );
$$;

-- ============================================================================
-- EXAMPLE: Apply admin-only RLS to marketplace_controls
-- ============================================================================
DO $$
BEGIN
  -- Only apply if table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'marketplace_controls') THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.marketplace_controls ENABLE ROW LEVEL SECURITY';

    -- Drop existing policies
    DROP POLICY IF EXISTS "Admins can view marketplace controls" ON public.marketplace_controls;
    DROP POLICY IF EXISTS "Admins can modify marketplace controls" ON public.marketplace_controls;

    -- Create admin-only policies
    CREATE POLICY "Admins can view marketplace controls"
      ON public.marketplace_controls
      FOR SELECT
      USING (public.is_current_user_admin());

    CREATE POLICY "Admins can modify marketplace controls"
      ON public.marketplace_controls
      FOR ALL
      USING (public.is_current_user_admin())
      WITH CHECK (public.is_current_user_admin());
  END IF;
END $$;

-- ============================================================================
-- EXAMPLE: Apply admin-only RLS to scraper_health
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scraper_health') THEN
    EXECUTE 'ALTER TABLE public.scraper_health ENABLE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS "Admins can view scraper health" ON public.scraper_health;
    DROP POLICY IF EXISTS "Admins can modify scraper health" ON public.scraper_health;

    CREATE POLICY "Admins can view scraper health"
      ON public.scraper_health
      FOR SELECT
      USING (public.is_current_user_admin());

    CREATE POLICY "Admins can modify scraper health"
      ON public.scraper_health
      FOR ALL
      USING (public.is_current_user_admin())
      WITH CHECK (public.is_current_user_admin());
  END IF;
END $$;

-- ============================================================================
-- EXAMPLE: Apply admin-only RLS to feature_flags
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'feature_flags') THEN
    EXECUTE 'ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS "Admins can view feature flags" ON public.feature_flags;
    DROP POLICY IF EXISTS "Admins can modify feature flags" ON public.feature_flags;

    CREATE POLICY "Admins can view feature flags"
      ON public.feature_flags
      FOR SELECT
      USING (public.is_current_user_admin());

    CREATE POLICY "Admins can modify feature flags"
      ON public.feature_flags
      FOR ALL
      USING (public.is_current_user_admin())
      WITH CHECK (public.is_current_user_admin());
  END IF;
END $$;

-- ============================================================================
-- PUBLIC READ access for scraped_listings (pooled marketplace data)
-- ============================================================================
-- scraped_listings should be viewable by all authenticated users
-- but modifications are admin-only

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scraped_listings') THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.scraped_listings ENABLE ROW LEVEL SECURITY';

    -- Drop existing policies
    DROP POLICY IF EXISTS "Authenticated users can view listings" ON public.scraped_listings;
    DROP POLICY IF EXISTS "Admins can modify listings" ON public.scraped_listings;

    -- All authenticated users can view pooled listings
    CREATE POLICY "Authenticated users can view listings"
      ON public.scraped_listings
      FOR SELECT
      USING (auth.role() = 'authenticated');

    -- Only admins can insert/update/delete
    CREATE POLICY "Admins can modify listings"
      ON public.scraped_listings
      FOR ALL
      USING (public.is_current_user_admin())
      WITH CHECK (public.is_current_user_admin());
  END IF;
END $$;

-- ============================================================================
-- PLAN-BASED FEATURE GATING EXAMPLES
-- ============================================================================
-- These are TEMPLATES you can adapt for specific features

-- Example 1: Limit free users to 10 saved searches
-- (Enforce in application logic via count check before insert)

-- Example 2: Elite-only access to specific marketplace data
-- CREATE POLICY "Elite users can view vinted data"
--   ON public.scraped_listings
--   FOR SELECT
--   USING (
--     marketplace = 'vinted'
--     AND EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE id = auth.uid()
--         AND plan_rank(plan) >= plan_rank('elite')
--     )
--   );

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.is_current_user_admin() IS
'Returns true if the current authenticated user (auth.uid()) has admin privileges. Used in RLS policies for admin-only tables.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- RLS Policies Active:
-- 1. saved_searches: Users can manage their own, no admin override
-- 2. marketplace_controls: Admin-only read/write
-- 3. scraper_health: Admin-only read/write
-- 4. feature_flags: Admin-only read/write
-- 5. scraped_listings: Public read, admin write
--
-- Helper Functions:
-- - is_current_user_admin(): Check if auth.uid() is admin
-- - plan_rank(text): Compare plan tiers numerically
-- - is_admin_user(uuid): Check if specific user is admin
-- ============================================================================
