-- Migration: Add search analytics fields
-- Date: 2025-12-13
-- Description: Add performance tracking columns to saved_searches table

-- Add analytics columns
ALTER TABLE saved_searches 
ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_listings_scanned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_matches_found INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_runs INTEGER DEFAULT 0;

-- Update existing searches to have default values
UPDATE saved_searches 
SET 
  total_listings_scanned = 0,
  total_matches_found = 0,
  total_runs = 0
WHERE total_listings_scanned IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN saved_searches.last_run_at IS 'Timestamp of last worker run for this search';
COMMENT ON COLUMN saved_searches.total_listings_scanned IS 'Cumulative count of listings fetched from marketplace';
COMMENT ON COLUMN saved_searches.total_matches_found IS 'Cumulative count of listings that matched criteria';
COMMENT ON COLUMN saved_searches.total_runs IS 'Total number of worker runs for this search';

-- Optional: Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_saved_searches_analytics 
ON saved_searches(user_id, last_run_at DESC) 
WHERE is_active = true;

-- Show summary
SELECT 
  'Migration completed' as status,
  COUNT(*) as total_searches,
  COUNT(CASE WHEN last_run_at IS NOT NULL THEN 1 END) as searches_with_runs,
  SUM(total_matches_found) as total_matches_system_wide
FROM saved_searches;
