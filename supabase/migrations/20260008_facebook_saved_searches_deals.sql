-- Ensure saved search + deals schema for Facebook marketplace pipeline
-- Idempotent: only adds tables/columns if missing

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'saved_searches'
  ) THEN
    CREATE TABLE public.saved_searches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      marketplace TEXT NOT NULL,
      name TEXT,
      params JSONB NOT NULL DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END$$;

-- Align existing saved_searches table with required columns
ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS marketplace TEXT;

ALTER TABLE public.saved_searches
  ALTER COLUMN marketplace SET DEFAULT 'facebook';

UPDATE public.saved_searches
SET marketplace = COALESCE(marketplace, 'facebook')
WHERE marketplace IS NULL;

ALTER TABLE public.saved_searches
  ALTER COLUMN marketplace SET NOT NULL;

ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS params JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE public.saved_searches
  ALTER COLUMN created_at SET DEFAULT now();

-- Allow nullable user_id for demo usage
ALTER TABLE public.saved_searches
  ALTER COLUMN user_id DROP NOT NULL;

-- Deals table for scraper output
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID REFERENCES public.saved_searches(id) ON DELETE CASCADE,
  marketplace TEXT,
  title TEXT,
  price NUMERIC,
  currency TEXT,
  score NUMERIC,
  location TEXT,
  url TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deals_search_id ON public.deals(search_id);
CREATE INDEX IF NOT EXISTS idx_deals_marketplace ON public.deals(marketplace);
CREATE UNIQUE INDEX IF NOT EXISTS deals_search_url_key ON public.deals(search_id, url);

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS score NUMERIC;
