-- =====================================================
-- Tighten saved_searches RLS: owner-only reads
--
-- Rationale:
-- - Prevent any public access to demo (user_id IS NULL) rows at the DB layer.
-- - Demo/public exposure (if desired) should be handled explicitly via server routes
--   using service_role + an app-level flag (e.g. DEMO_PUBLIC), not via RLS.
-- =====================================================

DO $$
BEGIN
  IF to_regclass('public.saved_searches') IS NULL THEN
    RAISE NOTICE 'Skipping saved_searches RLS tightening: public.saved_searches does not exist';
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY';

  -- Replace the prior policy that allowed user_id IS NULL rows to be selected publicly.
  EXECUTE 'DROP POLICY IF EXISTS "Saved searches: read own" ON public.saved_searches';
  EXECUTE $q$
    CREATE POLICY "Saved searches: read own"
    ON public.saved_searches
    FOR SELECT
    USING (auth.uid() = user_id)
  $q$;
END $$;

