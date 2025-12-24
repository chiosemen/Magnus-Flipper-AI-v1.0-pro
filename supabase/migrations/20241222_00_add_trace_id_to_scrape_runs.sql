-- Add trace_id column to scrape_runs for E2E observability
-- Safe: does nothing if table does not exist

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'scrape_runs'
  ) THEN
    ALTER TABLE public.scrape_runs
    ADD COLUMN IF NOT EXISTS trace_id TEXT;
    
    CREATE INDEX IF NOT EXISTS idx_scrape_runs_trace_id 
      ON public.scrape_runs(trace_id) 
      WHERE trace_id IS NOT NULL;
    
    COMMENT ON COLUMN public.scrape_runs.trace_id IS 'Unique trace ID for end-to-end observability from dispatch to UI';
  END IF;
END $$;

