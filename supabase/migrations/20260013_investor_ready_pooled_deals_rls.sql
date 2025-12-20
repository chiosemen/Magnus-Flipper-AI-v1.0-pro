-- =====================================================
-- Investor-ready pooled deals RLS
-- - saved_searches: owner-only writes; optional demo reads (user_id IS NULL)
-- - deal_pools: public read-only
-- - deals: handled by prior migration (20251219095500_deals_rls.sql)
-- =====================================================

DO $$
BEGIN
  -- -------------------------
  -- saved_searches
  -- -------------------------
  IF to_regclass('public.saved_searches') IS NULL THEN
    RAISE NOTICE 'Skipping saved_searches RLS: public.saved_searches table does not exist';
  ELSE
    EXECUTE 'ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY';

    -- Drop legacy policies (idempotent).
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own saved searches" ON public.saved_searches';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own saved searches" ON public.saved_searches';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own saved searches" ON public.saved_searches';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own saved searches" ON public.saved_searches';

    EXECUTE 'DROP POLICY IF EXISTS "Saved searches: read own" ON public.saved_searches';
    EXECUTE 'DROP POLICY IF EXISTS "Saved searches: insert own" ON public.saved_searches';
    EXECUTE 'DROP POLICY IF EXISTS "Saved searches: update own" ON public.saved_searches';
    EXECUTE 'DROP POLICY IF EXISTS "Saved searches: delete own" ON public.saved_searches';

    -- SELECT:
    -- - Owner can read their own saved searches.
    -- - Rows with user_id IS NULL are treated as demo seed and are safe to read publicly.
    EXECUTE $q$
      CREATE POLICY "Saved searches: read own"
      ON public.saved_searches
      FOR SELECT
      USING (auth.uid() = user_id OR user_id IS NULL)
    $q$;

    -- INSERT/UPDATE/DELETE: owner-only (prevents clients creating demo rows).
    EXECUTE $q$
      CREATE POLICY "Saved searches: insert own"
      ON public.saved_searches
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)
    $q$;

    EXECUTE $q$
      CREATE POLICY "Saved searches: update own"
      ON public.saved_searches
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)
    $q$;

    EXECUTE $q$
      CREATE POLICY "Saved searches: delete own"
      ON public.saved_searches
      FOR DELETE
      USING (auth.uid() = user_id)
    $q$;
  END IF;

  -- -------------------------
  -- deal_pools
  -- -------------------------
  IF to_regclass('public.deal_pools') IS NULL THEN
    RAISE NOTICE 'Skipping deal_pools RLS: public.deal_pools table does not exist';
  ELSE
    EXECUTE 'ALTER TABLE public.deal_pools ENABLE ROW LEVEL SECURITY';

    -- Public read-only access to pool registry (control-plane owned by operators).
    EXECUTE 'DROP POLICY IF EXISTS "Public read-only access to deal_pools" ON public.deal_pools';
    EXECUTE 'CREATE POLICY "Public read-only access to deal_pools" ON public.deal_pools FOR SELECT USING (true)';

    -- Block all client writes. (service_role bypasses RLS, so workers/admins retain full access.)
    EXECUTE 'DROP POLICY IF EXISTS "Block client writes to deal_pools" ON public.deal_pools';
    EXECUTE 'CREATE POLICY "Block client writes to deal_pools" ON public.deal_pools FOR ALL USING (false) WITH CHECK (false)';
  END IF;
END $$;

