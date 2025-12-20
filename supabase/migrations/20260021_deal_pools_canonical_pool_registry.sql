-- =====================================================
-- Canonical pool registry: deal_pools
-- - Migrate fb_pools rows into deal_pools (idempotent)
-- - Repoint dependent foreign keys to deal_pools
-- - Drop fb_pools to remove ambiguity
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure deal_pools can fully replace fb_pools state for scheduling/health.
DO $$
BEGIN
  IF to_regclass('public.deal_pools') IS NULL THEN
    RAISE NOTICE 'Skipping pool consolidation: deal_pools table does not exist';
    RETURN;
  END IF;

  -- Safety net: ensure region exists for worker/selector filters (defaults to US).
  EXECUTE 'ALTER TABLE public.deal_pools ADD COLUMN IF NOT EXISTS region text';
  EXECUTE $$UPDATE public.deal_pools SET region = COALESCE(region, 'US') WHERE region IS NULL$$;
  EXECUTE 'ALTER TABLE public.deal_pools ALTER COLUMN region SET DEFAULT ''US''';
  BEGIN
    EXECUTE 'ALTER TABLE public.deal_pools ALTER COLUMN region SET NOT NULL';
  EXCEPTION
    WHEN others THEN NULL;
  END;

  EXECUTE 'ALTER TABLE public.deal_pools ADD COLUMN IF NOT EXISTS status text';
  EXECUTE 'ALTER TABLE public.deal_pools ADD COLUMN IF NOT EXISTS priority integer';
  EXECUTE 'ALTER TABLE public.deal_pools ADD COLUMN IF NOT EXISTS consecutive_failures integer';
  EXECUTE 'ALTER TABLE public.deal_pools ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz';

  EXECUTE $$UPDATE public.deal_pools SET status = COALESCE(status, 'healthy') WHERE status IS NULL$$;
  EXECUTE $$UPDATE public.deal_pools SET priority = COALESCE(priority, 3) WHERE priority IS NULL$$;
  EXECUTE $$UPDATE public.deal_pools SET consecutive_failures = COALESCE(consecutive_failures, 0) WHERE consecutive_failures IS NULL$$;

  EXECUTE 'ALTER TABLE public.deal_pools ALTER COLUMN status SET DEFAULT ''healthy''';
  EXECUTE 'ALTER TABLE public.deal_pools ALTER COLUMN priority SET DEFAULT 3';
  EXECUTE 'ALTER TABLE public.deal_pools ALTER COLUMN consecutive_failures SET DEFAULT 0';

  BEGIN
    EXECUTE 'ALTER TABLE public.deal_pools ALTER COLUMN status SET NOT NULL';
  EXCEPTION
    WHEN others THEN NULL;
  END;

  BEGIN
    EXECUTE 'ALTER TABLE public.deal_pools ALTER COLUMN priority SET NOT NULL';
  EXCEPTION
    WHEN others THEN NULL;
  END;

  BEGIN
    EXECUTE 'ALTER TABLE public.deal_pools ALTER COLUMN consecutive_failures SET NOT NULL';
  EXCEPTION
    WHEN others THEN NULL;
  END;

  -- Region-aware scheduler indexes (idempotent).
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_pools_region_marketplace_next_run ON public.deal_pools (region, marketplace, next_run_at)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_pools_region_enabled_next_run ON public.deal_pools (region, enabled, next_run_at)';
END $$;

-- Migrate fb_pools rows into deal_pools, preserving UUIDs to avoid rewriting references.
DO $$
DECLARE
  inserted_count integer := 0;
BEGIN
  IF to_regclass('public.fb_pools') IS NULL THEN
    RAISE NOTICE 'fb_pools not found; skipping migration into deal_pools';
    RETURN;
  END IF;

  IF to_regclass('public.deal_pools') IS NULL THEN
    RAISE NOTICE 'deal_pools not found; skipping migration from fb_pools';
    RETURN;
  END IF;

  WITH src AS (
    SELECT
      p.*,
      coalesce(nullif(regexp_replace(regexp_replace(lower(trim(p.market)), '[^a-z0-9]+', '-', 'g'), '(^-+)|(-+$)', '', 'g'), ''), 'unknown') AS market_slug,
      coalesce(nullif(regexp_replace(regexp_replace(lower(trim(p.city)), '[^a-z0-9]+', '-', 'g'), '(^-+)|(-+$)', '', 'g'), ''), 'unknown') AS city_slug,
      coalesce(nullif(regexp_replace(regexp_replace(lower(trim(p.category)), '[^a-z0-9]+', '-', 'g'), '(^-+)|(-+$)', '', 'g'), ''), 'unknown') AS category_slug,
      CASE
        WHEN p.query_template IS NOT NULL AND length(trim(p.query_template)) > 0
          THEN substring(regexp_replace(regexp_replace(lower(trim(p.query_template)), '[^a-z0-9]+', '-', 'g'), '(^-+)|(-+$)', '', 'g') from 1 for 48)
        ELSE NULL
      END AS query_slug,
      CASE
        WHEN upper(trim(p.market)) IN ('UK', 'GB') THEN 'UK'
        ELSE 'US'
      END AS derived_region
    FROM public.fb_pools p
  ),
  enriched AS (
    SELECT
      s.*,
      ('facebook:' || s.market_slug || ':' || s.city_slug || ':' || s.category_slug ||
        CASE WHEN s.query_slug IS NOT NULL AND length(s.query_slug) > 0 THEN ':' || s.query_slug ELSE '' END
      ) AS pool_key
    FROM src s
  )
  INSERT INTO public.deal_pools (
    id,
    region,
    marketplace,
    pool_key,
    params,
    ttl_seconds,
    last_run_at,
    next_run_at,
    enabled,
    created_at,
    status,
    priority,
    consecutive_failures,
    last_attempt_at
  )
  SELECT
    e.id,
    e.derived_region,
    'facebook',
    e.pool_key,
    jsonb_build_object(
      'name', e.name,
      'market', e.market,
      'city', e.city,
      'radius_km', e.radius_km,
      'category', e.category,
      'query_template', e.query_template,
      'max_pages', e.max_pages
    ),
    COALESCE(e.refresh_ttl_seconds, 900),
    e.last_success_at,
    COALESCE(
      e.last_success_at + (COALESCE(e.refresh_ttl_seconds, 900)::text || ' seconds')::interval,
      now()
    ),
    COALESCE(e.enabled, true),
    COALESCE(e.created_at, now()),
    COALESCE(e.status, 'healthy'),
    COALESCE(e.priority, 3),
    COALESCE(e.consecutive_failures, 0),
    e.last_attempt_at
  FROM enriched e
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.deal_pools dp
    WHERE dp.id = e.id OR dp.pool_key = e.pool_key
  );

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % fb_pools rows into deal_pools', inserted_count;
END $$;

-- Repoint FKs from fb_pools -> deal_pools, then drop fb_pools.
DO $$
DECLARE
  constraint_name text;
BEGIN
  IF to_regclass('public.deal_pools') IS NULL THEN
    RAISE NOTICE 'Skipping FK repoint: deal_pools missing';
    RETURN;
  END IF;

  -- fb_listings.pool_id
  IF to_regclass('public.fb_listings') IS NOT NULL THEN
    IF to_regclass('public.fb_pools') IS NOT NULL THEN
      FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE contype = 'f'
          AND conrelid = 'public.fb_listings'::regclass
          AND confrelid = 'public.fb_pools'::regclass
      LOOP
        EXECUTE format('ALTER TABLE public.fb_listings DROP CONSTRAINT IF EXISTS %I', constraint_name);
      END LOOP;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE contype = 'f'
        AND conrelid = 'public.fb_listings'::regclass
        AND confrelid = 'public.deal_pools'::regclass
    ) THEN
      EXECUTE 'ALTER TABLE public.fb_listings ADD CONSTRAINT fb_listings_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES public.deal_pools(id) ON DELETE CASCADE';
    END IF;
  END IF;

  -- fb_scrape_runs.pool_id
  IF to_regclass('public.fb_scrape_runs') IS NOT NULL THEN
    IF to_regclass('public.fb_pools') IS NOT NULL THEN
      FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE contype = 'f'
          AND conrelid = 'public.fb_scrape_runs'::regclass
          AND confrelid = 'public.fb_pools'::regclass
      LOOP
        EXECUTE format('ALTER TABLE public.fb_scrape_runs DROP CONSTRAINT IF EXISTS %I', constraint_name);
      END LOOP;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE contype = 'f'
        AND conrelid = 'public.fb_scrape_runs'::regclass
        AND confrelid = 'public.deal_pools'::regclass
    ) THEN
      EXECUTE 'ALTER TABLE public.fb_scrape_runs ADD CONSTRAINT fb_scrape_runs_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES public.deal_pools(id)';
    END IF;
  END IF;

  -- search_events.pool_id
  IF to_regclass('public.search_events') IS NOT NULL THEN
    IF to_regclass('public.fb_pools') IS NOT NULL THEN
      FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE contype = 'f'
          AND conrelid = 'public.search_events'::regclass
          AND confrelid = 'public.fb_pools'::regclass
      LOOP
        EXECUTE format('ALTER TABLE public.search_events DROP CONSTRAINT IF EXISTS %I', constraint_name);
      END LOOP;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE contype = 'f'
        AND conrelid = 'public.search_events'::regclass
        AND confrelid = 'public.deal_pools'::regclass
    ) THEN
      EXECUTE 'ALTER TABLE public.search_events ADD CONSTRAINT search_events_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES public.deal_pools(id)';
    END IF;
  END IF;

  -- user_refresh_requests.pool_id
  IF to_regclass('public.user_refresh_requests') IS NOT NULL THEN
    IF to_regclass('public.fb_pools') IS NOT NULL THEN
      FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE contype = 'f'
          AND conrelid = 'public.user_refresh_requests'::regclass
          AND confrelid = 'public.fb_pools'::regclass
      LOOP
        EXECUTE format('ALTER TABLE public.user_refresh_requests DROP CONSTRAINT IF EXISTS %I', constraint_name);
      END LOOP;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE contype = 'f'
        AND conrelid = 'public.user_refresh_requests'::regclass
        AND confrelid = 'public.deal_pools'::regclass
    ) THEN
      EXECUTE 'ALTER TABLE public.user_refresh_requests ADD CONSTRAINT user_refresh_requests_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES public.deal_pools(id)';
    END IF;
  END IF;

  -- Finally, drop fb_pools to remove ambiguity.
  IF to_regclass('public.fb_pools') IS NOT NULL THEN
    EXECUTE 'DROP TABLE public.fb_pools';
  END IF;
END $$;
