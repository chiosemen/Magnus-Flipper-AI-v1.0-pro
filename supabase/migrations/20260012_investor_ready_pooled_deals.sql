-- =====================================================
-- Investor-ready pooled deals schema (idempotent)
-- - saved_searches: add name + updated_at + indexes
-- - deal_pools: pooled scrape registry
-- - deals: pooled market state columns (keeps legacy columns)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------
-- saved_searches alignment
-- -------------------------
DO $$
BEGIN
  IF to_regclass('public.saved_searches') IS NULL THEN
    RAISE NOTICE 'Skipping saved_searches alignment: table does not exist';
  ELSE
    EXECUTE 'ALTER TABLE public.saved_searches ADD COLUMN IF NOT EXISTS name text';
    EXECUTE 'ALTER TABLE public.saved_searches ADD COLUMN IF NOT EXISTS updated_at timestamptz';

    -- Allow nullable name (optional).
    BEGIN
      EXECUTE 'ALTER TABLE public.saved_searches ALTER COLUMN name DROP NOT NULL';
    EXCEPTION
      WHEN undefined_column THEN NULL;
      WHEN others THEN NULL;
    END;

    -- Backfill updated_at for legacy rows.
    EXECUTE $q$
      UPDATE public.saved_searches
      SET updated_at = COALESCE(updated_at, created_at, now())
      WHERE updated_at IS NULL
    $q$;

    EXECUTE 'ALTER TABLE public.saved_searches ALTER COLUMN updated_at SET DEFAULT now()';
    EXECUTE 'ALTER TABLE public.saved_searches ALTER COLUMN updated_at SET NOT NULL';

    -- Indexes for UI hydration & ordering.
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id_created_at ON public.saved_searches (user_id, created_at DESC)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_saved_searches_marketplace_created_at ON public.saved_searches (marketplace, created_at DESC)';
  END IF;
END $$;

-- -------------------------
-- deal_pools (pooled scrape registry)
-- -------------------------
CREATE TABLE IF NOT EXISTS public.deal_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace text NOT NULL,
  pool_key text NOT NULL UNIQUE,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  ttl_seconds integer NOT NULL DEFAULT 900,
  last_run_at timestamptz,
  next_run_at timestamptz,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pools_marketplace_next_run
  ON public.deal_pools (marketplace, next_run_at);

CREATE INDEX IF NOT EXISTS idx_pools_enabled_next_run
  ON public.deal_pools (enabled, next_run_at);

-- -------------------------
-- deals pooled columns
-- -------------------------
DO $$
DECLARE
  score_type text;
BEGIN
  IF to_regclass('public.deals') IS NULL THEN
    RAISE NOTICE 'Skipping deals alignment: table does not exist';
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS pool_key text';
  EXECUTE 'ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS listing_id text';
  EXECUTE 'ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS seller_type text';
  EXECUTE 'ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS posted_at timestamptz';
  EXECUTE 'ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS fetched_at timestamptz';
  EXECUTE 'ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS expires_at timestamptz';
  EXECUTE 'ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT ''[]''::jsonb';
  EXECUTE 'ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS primary_image text';
  EXECUTE 'ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS thumbnail text';
  EXECUTE 'ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS attributes jsonb NOT NULL DEFAULT ''{}''::jsonb';

  -- marketplace: required, backfill from legacy rows.
  EXECUTE $q$
    UPDATE public.deals
    SET marketplace = COALESCE(marketplace, 'facebook')
    WHERE marketplace IS NULL
  $q$;
  EXECUTE 'ALTER TABLE public.deals ALTER COLUMN marketplace SET DEFAULT ''facebook''';
  BEGIN
    EXECUTE 'ALTER TABLE public.deals ALTER COLUMN marketplace SET NOT NULL';
  EXCEPTION
    WHEN others THEN NULL;
  END;

  -- fetched_at: required for freshness ordering (backfill from created_at).
  EXECUTE $q$
    UPDATE public.deals
    SET fetched_at = COALESCE(fetched_at, created_at, now())
    WHERE fetched_at IS NULL
  $q$;
  EXECUTE 'ALTER TABLE public.deals ALTER COLUMN fetched_at SET DEFAULT now()';
  EXECUTE 'ALTER TABLE public.deals ALTER COLUMN fetched_at SET NOT NULL';

  -- score: canonical integer (0..100). Convert legacy numeric score if needed.
  SELECT c.data_type
  INTO score_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'deals'
    AND c.column_name = 'score';

  IF score_type IS NULL THEN
    EXECUTE 'ALTER TABLE public.deals ADD COLUMN score integer NOT NULL DEFAULT 0';
  ELSIF score_type <> 'integer' THEN
    EXECUTE 'UPDATE public.deals SET score = COALESCE(score, 0) WHERE score IS NULL';
    EXECUTE 'ALTER TABLE public.deals ALTER COLUMN score TYPE integer USING COALESCE(round(score), 0)::integer';
    EXECUTE 'ALTER TABLE public.deals ALTER COLUMN score SET DEFAULT 0';
    EXECUTE 'ALTER TABLE public.deals ALTER COLUMN score SET NOT NULL';
  ELSE
    EXECUTE 'UPDATE public.deals SET score = COALESCE(score, 0) WHERE score IS NULL';
    EXECUTE 'ALTER TABLE public.deals ALTER COLUMN score SET DEFAULT 0';
    EXECUTE 'ALTER TABLE public.deals ALTER COLUMN score SET NOT NULL';
  END IF;

  -- Indexes for pooled reads.
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_deals_marketplace_fetched_at ON public.deals (marketplace, fetched_at DESC)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_deals_pool_key_fetched_at ON public.deals (pool_key, fetched_at DESC)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_deals_score_fetched_at ON public.deals (score DESC, fetched_at DESC)';

  -- Dedup guard for pooled listings.
  EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS deals_marketplace_listing_id_uidx ON public.deals (marketplace, listing_id)';
END $$;

