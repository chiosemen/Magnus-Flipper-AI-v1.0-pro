CREATE TABLE saved_search_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id TEXT NOT NULL,
  marketplace TEXT NOT NULL,
  run_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  run_completed_at TIMESTAMPTZ,
  total_results INT DEFAULT 0,
  new_results INT DEFAULT 0,
  error BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_saved_search_runs_saved_search_id
ON saved_search_runs(saved_search_id);

CREATE INDEX idx_saved_search_runs_marketplace
ON saved_search_runs(marketplace);

CREATE INDEX idx_saved_search_runs_run_started_at
ON saved_search_runs(run_started_at DESC);

COMMENT ON TABLE saved_search_runs IS 'Tracks execution history of saved searches across marketplaces';
COMMENT ON COLUMN saved_search_runs.id IS 'Unique identifier for this search run';
COMMENT ON COLUMN saved_search_runs.saved_search_id IS 'ID of the saved search that was executed';
COMMENT ON COLUMN saved_search_runs.marketplace IS 'Marketplace that was scraped (VINTED, EBAY, GUMTREE, etc)';
COMMENT ON COLUMN saved_search_runs.run_started_at IS 'Timestamp when the search run started';
COMMENT ON COLUMN saved_search_runs.run_completed_at IS 'Timestamp when the search run completed';
COMMENT ON COLUMN saved_search_runs.total_results IS 'Total number of listings found';
COMMENT ON COLUMN saved_search_runs.new_results IS 'Number of new listings (not seen before)';
COMMENT ON COLUMN saved_search_runs.error IS 'Whether the run encountered an error';

CREATE TABLE saved_search_hits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  marketplace TEXT NOT NULL,
  external_id TEXT NOT NULL,
  hit_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_saved_search_hits_run_marketplace_external
ON saved_search_hits(run_id, marketplace, external_id);

CREATE INDEX idx_saved_search_hits_run_id
ON saved_search_hits(run_id);

CREATE INDEX idx_saved_search_hits_created_at
ON saved_search_hits(created_at DESC);

COMMENT ON TABLE saved_search_hits IS 'Individual listing matches found during search runs';
COMMENT ON COLUMN saved_search_hits.id IS 'Unique identifier for this hit record';
COMMENT ON COLUMN saved_search_hits.run_id IS 'ID of the search run that found this listing';
COMMENT ON COLUMN saved_search_hits.marketplace IS 'Marketplace where the listing was found';
COMMENT ON COLUMN saved_search_hits.external_id IS 'External listing ID from the marketplace';
COMMENT ON COLUMN saved_search_hits.hit_reason IS 'Why this listing matched (price, keyword, etc)';
COMMENT ON COLUMN saved_search_hits.created_at IS 'Timestamp when this hit was recorded';

CREATE TABLE saved_search_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id TEXT NOT NULL UNIQUE,
  total_runs INT DEFAULT 0,
  total_hits INT DEFAULT 0,
  ctr NUMERIC,
  avg_hits_per_run NUMERIC,
  last_run_at TIMESTAMPTZ
);

CREATE INDEX idx_saved_search_metrics_saved_search_id
ON saved_search_metrics(saved_search_id);

CREATE INDEX idx_saved_search_metrics_last_run_at
ON saved_search_metrics(last_run_at DESC);

COMMENT ON TABLE saved_search_metrics IS 'Aggregated performance metrics for saved searches';
COMMENT ON COLUMN saved_search_metrics.id IS 'Unique identifier for this metrics record';
COMMENT ON COLUMN saved_search_metrics.saved_search_id IS 'ID of the saved search being tracked';
COMMENT ON COLUMN saved_search_metrics.total_runs IS 'Total number of times this search has been executed';
COMMENT ON COLUMN saved_search_metrics.total_hits IS 'Total number of listings found across all runs';
COMMENT ON COLUMN saved_search_metrics.ctr IS 'Click-through rate (if applicable)';
COMMENT ON COLUMN saved_search_metrics.avg_hits_per_run IS 'Average number of hits per search run';
COMMENT ON COLUMN saved_search_metrics.last_run_at IS 'Timestamp of the most recent search run';
