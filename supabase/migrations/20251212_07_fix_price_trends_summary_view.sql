-- =============================================================================
-- Fix: price_trends_summary view
-- Reason: PostgreSQL does not allow window functions mixed with GROUP BY
-- Solution: Separate window logic into a CTE
-- =============================================================================

CREATE OR REPLACE VIEW price_trends_summary AS
WITH price_window AS (
  SELECT
    ph.marketplace,
    ph.external_id,
    ml.title,
    ml.url,
    ph.price,
    ph.recorded_at,
    FIRST_VALUE(ph.price) OVER (
      PARTITION BY ph.marketplace, ph.external_id
      ORDER BY ph.recorded_at DESC
    ) AS current_price,
    FIRST_VALUE(ph.price) OVER (
      PARTITION BY ph.marketplace, ph.external_id
      ORDER BY ph.recorded_at ASC
    ) AS initial_price
  FROM price_history ph
  JOIN marketplace_listings ml
    ON ml.external_id = ph.external_id
   AND ml.marketplace = ph.marketplace
)

SELECT
  marketplace,
  external_id,
  title,
  url,
  COUNT(*)                          AS price_changes_count,
  MIN(price)                        AS lowest_price,
  MAX(price)                        AS highest_price,
  MAX(current_price)                AS current_price,
  MIN(initial_price)                AS initial_price,
  MAX(current_price) - MIN(initial_price) AS total_price_change,
  MIN(recorded_at)                  AS first_seen,
  MAX(recorded_at)                  AS last_seen
FROM price_window
GROUP BY
  marketplace,
  external_id,
  title,
  url;

