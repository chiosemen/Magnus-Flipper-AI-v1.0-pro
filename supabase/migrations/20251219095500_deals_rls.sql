-- Deals RLS (read-only public access)
-- Goal:
-- - Allow anon + authenticated clients to SELECT deals (including image fields)
-- - Block all client-side writes (INSERT/UPDATE/DELETE)
-- - Preserve full access for service_role (bypasses RLS in Supabase)

DO $$
BEGIN
  IF to_regclass('public.deals') IS NULL THEN
    RAISE NOTICE 'Skipping deals RLS: public.deals table does not exist';
    RETURN;
  END IF;

  -- Enable RLS on deals.
  EXECUTE 'ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY';

  -- Public users (anon + authenticated) can read deals.
  EXECUTE 'DROP POLICY IF EXISTS "Public read-only access to deals" ON public.deals';
  EXECUTE 'CREATE POLICY "Public read-only access to deals" ON public.deals FOR SELECT USING (true)';

  -- Block all client writes. (service_role bypasses RLS, so workers retain full access.)
  EXECUTE 'DROP POLICY IF EXISTS "Block client writes to deals" ON public.deals';
  EXECUTE 'CREATE POLICY "Block client writes to deals" ON public.deals FOR ALL USING (false) WITH CHECK (false)';
END $$;
