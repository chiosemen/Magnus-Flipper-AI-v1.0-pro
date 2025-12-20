-- Remove unused demand-weighting artifacts.
-- Scheduler selection is TTL + priority (+ budget throttling), with no demand signals.

DROP FUNCTION IF EXISTS public.fb_pool_demand_last_hour();
DROP TABLE IF EXISTS public.search_events;

