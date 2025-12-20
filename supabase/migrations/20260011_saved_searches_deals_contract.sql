-- =====================================================
-- Canonical data contract: saved_searches + deals
-- Idempotent alignment + dedupe cleanup
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------
-- saved_searches (canonical)
-- -------------------------
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  marketplace text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Allow nullable user_id (demo/support usage).
ALTER TABLE public.saved_searches
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS marketplace text;

-- Legacy rename(s) -> canonical
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_searches'
      AND column_name = 'parameters'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_searches'
      AND column_name = 'params'
  ) THEN
    EXECUTE 'ALTER TABLE public.saved_searches RENAME COLUMN parameters TO params';
  END IF;
END $$;

ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS params jsonb;

ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS status text;

ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- Backfill marketplace from legacy marketplaces[] column when present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_searches'
      AND column_name = 'marketplaces'
  ) THEN
    EXECUTE $q$
      UPDATE public.saved_searches
      SET marketplace = COALESCE(
        marketplace,
        CASE
          WHEN marketplaces IS NULL OR array_length(marketplaces, 1) IS NULL THEN NULL
          WHEN array_position(marketplaces, 'FB_MARKETPLACE') IS NOT NULL THEN 'facebook'
          WHEN array_position(marketplaces, 'FACEBOOK') IS NOT NULL THEN 'facebook'
          WHEN array_position(marketplaces, 'facebook') IS NOT NULL THEN 'facebook'
          WHEN array_length(marketplaces, 1) = 1 THEN lower(marketplaces[1])
          ELSE NULL
        END
      )
      WHERE marketplace IS NULL;
    $q$;
  END IF;
END $$;

UPDATE public.saved_searches
SET marketplace = COALESCE(marketplace, 'facebook')
WHERE marketplace IS NULL;

-- Backfill status from legacy active boolean column when present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_searches'
      AND column_name = 'active'
  ) THEN
    EXECUTE $q$
      UPDATE public.saved_searches
      SET status = CASE WHEN active THEN 'active' ELSE 'paused' END
      WHERE status IS NULL;
    $q$;
  END IF;
END $$;

UPDATE public.saved_searches
SET status = COALESCE(status, 'active')
WHERE status IS NULL;

UPDATE public.saved_searches
SET created_at = COALESCE(created_at, now())
WHERE created_at IS NULL;

UPDATE public.saved_searches
SET params = COALESCE(params, '{}'::jsonb)
WHERE params IS NULL;

-- Backfill params JSONB from legacy query column if present and params is empty.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_searches'
      AND column_name = 'query'
  ) THEN
    EXECUTE $q$
      UPDATE public.saved_searches
      SET params = jsonb_build_object('query', query)
      WHERE (params IS NULL OR params = '{}'::jsonb)
        AND query IS NOT NULL
        AND btrim(query) <> '';
    $q$;
  END IF;
END $$;

-- Backfill params JSONB from legacy structured columns when present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_searches'
      AND column_name = 'keywords'
  ) THEN
    EXECUTE $q$
      UPDATE public.saved_searches
      SET params = COALESCE(params, '{}'::jsonb) || jsonb_build_object('keywords', to_jsonb(keywords))
      WHERE (params IS NULL OR NOT (params ? 'keywords'))
        AND keywords IS NOT NULL
        AND array_length(keywords, 1) > 0;
    $q$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_searches'
      AND column_name = 'category'
  ) THEN
    EXECUTE $q$
      UPDATE public.saved_searches
      SET params = COALESCE(params, '{}'::jsonb) || jsonb_build_object('category', to_jsonb(category))
      WHERE (params IS NULL OR NOT (params ? 'category'))
        AND category IS NOT NULL
        AND btrim(category) <> '';
    $q$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_searches'
      AND column_name = 'min_price'
  ) THEN
    EXECUTE $q$
      UPDATE public.saved_searches
      SET params = COALESCE(params, '{}'::jsonb) || jsonb_build_object('minPrice', to_jsonb(min_price))
      WHERE (params IS NULL OR NOT (params ? 'minPrice'))
        AND min_price IS NOT NULL;
    $q$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_searches'
      AND column_name = 'max_price'
  ) THEN
    EXECUTE $q$
      UPDATE public.saved_searches
      SET params = COALESCE(params, '{}'::jsonb) || jsonb_build_object('maxPrice', to_jsonb(max_price))
      WHERE (params IS NULL OR NOT (params ? 'maxPrice'))
        AND max_price IS NOT NULL;
    $q$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_searches'
      AND column_name = 'location'
  ) THEN
    EXECUTE $q$
      UPDATE public.saved_searches
      SET params = COALESCE(params, '{}'::jsonb) || jsonb_build_object('location', to_jsonb(location))
      WHERE (params IS NULL OR NOT (params ? 'location'))
        AND location IS NOT NULL
        AND btrim(location) <> '';
    $q$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_searches'
      AND column_name = 'condition'
  ) THEN
    EXECUTE $q$
      UPDATE public.saved_searches
      SET params = COALESCE(params, '{}'::jsonb) || jsonb_build_object('condition', to_jsonb(ARRAY[condition]))
      WHERE (params IS NULL OR NOT (params ? 'condition'))
        AND condition IS NOT NULL
        AND btrim(condition) <> '';
    $q$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_searches'
      AND column_name = 'marketplaces'
  ) THEN
    EXECUTE $q$
      UPDATE public.saved_searches
      SET params = COALESCE(params, '{}'::jsonb) || jsonb_build_object('marketplaces', to_jsonb(marketplaces))
      WHERE (params IS NULL OR NOT (params ? 'marketplaces'))
        AND marketplaces IS NOT NULL
        AND array_length(marketplaces, 1) > 0;
    $q$;
  END IF;
END $$;

ALTER TABLE public.saved_searches
  ALTER COLUMN marketplace SET DEFAULT 'facebook';

ALTER TABLE public.saved_searches
  ALTER COLUMN params SET DEFAULT '{}'::jsonb;

ALTER TABLE public.saved_searches
  ALTER COLUMN status SET DEFAULT 'active';

ALTER TABLE public.saved_searches
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.saved_searches
  ALTER COLUMN marketplace SET NOT NULL;

ALTER TABLE public.saved_searches
  ALTER COLUMN params SET NOT NULL;

ALTER TABLE public.saved_searches
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.saved_searches
  ALTER COLUMN created_at SET NOT NULL;

-- -------------------
-- deals (canonical)
-- -------------------
CREATE TABLE IF NOT EXISTS public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid REFERENCES public.saved_searches(id) ON DELETE CASCADE,
  marketplace text,
  data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS search_id uuid;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS marketplace text;

-- Legacy rename(s) -> canonical
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'deals'
      AND column_name = 'raw'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'deals'
      AND column_name = 'data'
  ) THEN
    EXECUTE 'ALTER TABLE public.deals RENAME COLUMN raw TO data';
  END IF;
END $$;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS data jsonb;

-- If both raw and data exist, backfill data from raw where data is null.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'deals'
      AND column_name = 'raw'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'deals'
      AND column_name = 'data'
  ) THEN
    EXECUTE $q$
      UPDATE public.deals
      SET data = COALESCE(data, raw, '{}'::jsonb)
      WHERE data IS NULL;
    $q$;
  END IF;
END $$;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

UPDATE public.deals
SET created_at = COALESCE(created_at, now())
WHERE created_at IS NULL;

UPDATE public.deals
SET data = COALESCE(data, '{}'::jsonb)
WHERE data IS NULL;

ALTER TABLE public.deals
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.deals
  ALTER COLUMN created_at SET NOT NULL;

-- Ensure FK (idempotent, regardless of constraint name).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'deals'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'search_id'
      AND ccu.table_name = 'saved_searches'
      AND ccu.column_name = 'id'
  ) THEN
    EXECUTE 'ALTER TABLE public.deals ADD CONSTRAINT deals_search_id_fkey FOREIGN KEY (search_id) REFERENCES public.saved_searches(id) ON DELETE CASCADE';
  END IF;
END $$;

-- -------------------------
-- saved_searches dedupe
-- -------------------------
-- Cleanup duplicates (keep oldest created_at per key).
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, marketplace, params
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.saved_searches
)
DELETE FROM public.saved_searches s
USING ranked r
WHERE s.id = r.id
  AND r.rn > 1;

-- Dedupe guard.
CREATE UNIQUE INDEX IF NOT EXISTS saved_searches_user_marketplace_params_uidx
  ON public.saved_searches (user_id, marketplace, params)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS saved_searches_marketplace_params_uidx
  ON public.saved_searches (marketplace, params)
  WHERE user_id IS NULL;
