-- =====================================================
-- Region as a first-class concept (US/UK)
-- - Adds `region` to saved_searches, deal_pools, deals
-- - Backfills region for existing rows
-- - Adds region-aware indexes for pooled reads
-- =====================================================

DO $$
BEGIN
  -- saved_searches
  IF to_regclass('public.saved_searches') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.saved_searches ADD COLUMN IF NOT EXISTS region text';

    -- Best-effort backfill (safe defaults).
    EXECUTE $q$
      UPDATE public.saved_searches
      SET region = COALESCE(
        region,
        CASE
          WHEN lower(marketplace) IN ('gumtree', 'vinted') THEN 'UK'
          WHEN (params ? 'location') AND lower(COALESCE(params->>'location', '')) LIKE '%london%' THEN 'UK'
          WHEN (params ? 'location') AND lower(COALESCE(params->>'location', '')) LIKE '%manchester%' THEN 'UK'
          ELSE 'US'
        END
      )
      WHERE region IS NULL
    $q$;

    EXECUTE 'ALTER TABLE public.saved_searches ALTER COLUMN region SET DEFAULT ''US''';
    BEGIN
      EXECUTE 'ALTER TABLE public.saved_searches ALTER COLUMN region SET NOT NULL';
    EXCEPTION
      WHEN others THEN NULL;
    END;
  END IF;

  -- deal_pools
  IF to_regclass('public.deal_pools') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.deal_pools ADD COLUMN IF NOT EXISTS region text';

    EXECUTE $q$
      UPDATE public.deal_pools
      SET region = COALESCE(
        region,
        CASE
          WHEN lower(marketplace) IN ('gumtree', 'vinted') THEN 'UK'
          WHEN lower(pool_key) LIKE '%:uk:%' OR lower(pool_key) LIKE '%:gb:%' THEN 'UK'
          ELSE 'US'
        END
      )
      WHERE region IS NULL
    $q$;

    EXECUTE 'ALTER TABLE public.deal_pools ALTER COLUMN region SET DEFAULT ''US''';
    BEGIN
      EXECUTE 'ALTER TABLE public.deal_pools ALTER COLUMN region SET NOT NULL';
    EXCEPTION
      WHEN others THEN NULL;
    END;

    -- Region-aware scheduler indexes (helps region-scoped schedulers).
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_pools_region_marketplace_next_run ON public.deal_pools (region, marketplace, next_run_at)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_pools_region_enabled_next_run ON public.deal_pools (region, enabled, next_run_at)';
  END IF;

  -- deals (pooled market state)
  IF to_regclass('public.deals') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS region text';

    -- Best-effort backfill (safe defaults).
    EXECUTE $q$
      UPDATE public.deals
      SET region = COALESCE(
        region,
        CASE
          WHEN lower(marketplace) IN ('gumtree', 'vinted') THEN 'UK'
          WHEN lower(pool_key) LIKE '%:uk:%' OR lower(pool_key) LIKE '%:gb:%' THEN 'UK'
          WHEN currency = 'GBP' THEN 'UK'
          ELSE 'US'
        END
      )
      WHERE region IS NULL
    $q$;

    EXECUTE 'ALTER TABLE public.deals ALTER COLUMN region SET DEFAULT ''US''';
    BEGIN
      EXECUTE 'ALTER TABLE public.deals ALTER COLUMN region SET NOT NULL';
    EXCEPTION
      WHEN others THEN NULL;
    END;

    -- Region-aware pooled reads.
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_deals_region_marketplace_fetched_at ON public.deals (region, marketplace, fetched_at DESC)';
  END IF;
END $$;

