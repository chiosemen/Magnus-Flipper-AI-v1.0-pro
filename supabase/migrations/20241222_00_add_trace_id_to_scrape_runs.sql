-- Add trace_id column to scrape_runs for E2E observability
-- This enables tracking a scrape job from dispatch → DB → API → UI

ALTER TABLE scrape_runs 
ADD COLUMN IF NOT EXISTS trace_id TEXT;

CREATE INDEX IF NOT EXISTS idx_scrape_runs_trace_id 
  ON scrape_runs(trace_id) 
  WHERE trace_id IS NOT NULL;

COMMENT ON COLUMN scrape_runs.trace_id IS 'Unique trace ID for end-to-end observability from dispatch to UI';

