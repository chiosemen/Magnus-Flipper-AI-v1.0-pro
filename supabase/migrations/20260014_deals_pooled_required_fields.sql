-- =====================================================
-- Pooled deals integrity guard (idempotent)
-- - When a deal row represents pooled market state (search_id IS NULL),
--   require pool_key + listing_id to be present.
-- - Keeps backward compatibility for legacy per-search deals rows.
-- =====================================================

DO $$
BEGIN
  IF to_regclass('public.deals') IS NULL THEN
    RAISE NOTICE 'Skipping pooled deals constraint: public.deals table does not exist';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'deals_pooled_requires_ids'
      AND conrelid = 'public.deals'::regclass
  ) THEN
    EXECUTE $q$
      ALTER TABLE public.deals
      ADD CONSTRAINT deals_pooled_requires_ids
      CHECK (search_id IS NOT NULL OR (pool_key IS NOT NULL AND listing_id IS NOT NULL))
      NOT VALID
    $q$;
  END IF;
END $$;
