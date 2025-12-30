import { getServiceSupabaseClient } from './supabase';

/**
 * Usage Metering for Market Agent
 * Minimal viable logging + limit enforcement
 */

export type UsageEventType = 'run' | 'refresh_tick' | 'seed_ingest';

export type UsageEvent = {
  userId: string;
  eventType: UsageEventType;
  marketplace: string;
  queryNorm: string;
  itemsReturned: number;
  cacheStatus: string;
  strategy: string;
  latencyMs: number;
  billable: boolean;
};

export type UsageLimits = {
  runsPerDay: number;
  itemsPerDay: number;
};

export type UsageRollupSnapshot = {
  runs: number;
  refreshTicks: number;
  seedIngests: number;
  itemsReturned: number;
  uniqueQueries: number;
  billableRuns: number;
};

export const DEFAULT_LIMITS: UsageLimits = {
  runsPerDay: 250,
  itemsPerDay: 20000,
};

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Log a usage event (append-only)
 */
export async function logUsageEvent(event: UsageEvent): Promise<void> {
  const supabase = getServiceSupabaseClient();

  const { error } = await supabase.from('market_agent_usage_events').insert({
    user_id: event.userId,
    event_type: event.eventType,
    marketplace: event.marketplace,
    query_norm: event.queryNorm,
    items_returned: event.itemsReturned,
    cache_status: event.cacheStatus,
    strategy: event.strategy,
    latency_ms: event.latencyMs,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Check if user has exceeded daily limits
 */
export async function checkUsageLimits(
  userId: string,
  limits: UsageLimits = DEFAULT_LIMITS
): Promise<{ allowed: boolean; current: UsageRollupSnapshot }> {
  const supabase = getServiceSupabaseClient();
  const date = todayUtcDate();

  const { data, error } = await supabase
    .from('market_agent_usage_rollups_daily')
    .select('runs, refresh_ticks, seed_ingests, items_returned, unique_queries, billable_runs')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const current: UsageRollupSnapshot = {
    runs: data?.runs ?? 0,
    refreshTicks: data?.refresh_ticks ?? 0,
    seedIngests: data?.seed_ingests ?? 0,
    itemsReturned: data?.items_returned ?? 0,
    uniqueQueries: data?.unique_queries ?? 0,
    billableRuns: data?.billable_runs ?? 0,
  };

  const allowed =
    current.runs < limits.runsPerDay && current.itemsReturned < limits.itemsPerDay;

  return { allowed, current };
}

/**
 * Increment daily rollup counters
 */
export async function incrementDailyRollup(
  params: {
    userId: string;
    eventType: UsageEventType;
    queryNorm: string;
    itemsReturned: number;
    billable: boolean;
  }
): Promise<void> {
  const supabase = getServiceSupabaseClient();
  const date = todayUtcDate();

  const runDelta = params.eventType === 'run' ? 1 : 0;
  const refreshDelta = params.eventType === 'refresh_tick' ? 1 : 0;
  const seedDelta = params.eventType === 'seed_ingest' ? 1 : 0;
  const billableRuns = params.billable && params.eventType === 'run' ? 1 : 0;
  const itemsReturned = params.billable ? params.itemsReturned : 0;

  const { error } = await supabase.rpc('increment_market_agent_rollup', {
    p_user_id: params.userId,
    p_date: date,
    p_runs: runDelta,
    p_refresh_ticks: refreshDelta,
    p_seed_ingests: seedDelta,
    p_items_returned: itemsReturned,
    p_billable_runs: billableRuns,
    p_query_norm: params.queryNorm,
  });

  if (error) {
    throw new Error(error.message);
  }
}
