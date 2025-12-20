import { getSupabase } from "./services/supabase";
import { getWorkerRegionFromEnv } from "./region";

type PoolRow = {
  id: string;
  ttl_seconds: number;
  last_run_at: string | null;
  next_run_at: string | null;
  priority: number;
};

function toNumber(value: unknown): number {
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num) ? Number(num) : 0;
}

/**
 * Select pools to refresh based on staleness and priority.
 *
 * - TTL prevents staleness
 * - Priority encodes business intent
 *
 * NOTE: budget enforcement should be applied by the caller by limiting `maxPools`
 * per tick (and/or per day), rather than mutating pool settings per-user.
 */
export async function selectPoolsForRefresh({
  maxPools,
}: {
  maxPools: number;
}): Promise<string[]> {
  const nowMs = Date.now();
  const region = getWorkerRegionFromEnv();

  let poolsQuery = getSupabase()
    .from("deal_pools")
    .select("id, ttl_seconds, last_run_at, next_run_at, priority")
    .eq("marketplace", "facebook")
    .eq("enabled", true)
    .eq("status", "healthy");

  if (region) {
    poolsQuery = poolsQuery.eq("region", region);
  }

  const { data: pools, error: poolsError } = await poolsQuery;

  if (poolsError) {
    console.error("[fb-pool-scheduler] Failed to load pools", poolsError);
    return [];
  }

  if (!pools || pools.length === 0) return [];

  const scored: Array<PoolRow & { score: number }> = (pools as PoolRow[]).map((p) => {
    const lastMs = p.last_run_at ? new Date(p.last_run_at).getTime() : 0;
    const ageSeconds = (nowMs - lastMs) / 1000;
    const ttlSeconds = Math.max(1, toNumber(p.ttl_seconds));
    const ttlOverdue = ageSeconds / ttlSeconds;

    // Higher score = higher scheduling priority
    const score = ttlOverdue * 2 + (6 - p.priority) * 1.5;

    return {
      ...p,
      score,
    };
  });

  const due = scored.filter((p) => {
    // Primary due signal: next_run_at (set by the runner after each scrape).
    if (p.next_run_at) {
      const nextMs = new Date(p.next_run_at).getTime();
      return !Number.isFinite(nextMs) || nextMs <= nowMs;
    }

    // Safety net: if next_run_at is missing (legacy rows), derive due-ness from last_run_at + ttl.
    // This prevents accidental over-scraping (e.g., every scheduler tick) when next_run_at is NULL.
    if (p.last_run_at) {
      const lastMs = new Date(p.last_run_at).getTime();
      if (!Number.isFinite(lastMs)) return true;
      const ttlSeconds = Math.max(1, toNumber(p.ttl_seconds));
      return lastMs + ttlSeconds * 1000 <= nowMs;
    }

    // Never scraped before: due immediately.
    return true;
  });

  if (due.length === 0) return [];

  due.sort((a, b) => {
    const delta = b.score - a.score;
    if (delta !== 0) return delta;

    // Deterministic tie-breakers
    const pri = (a.priority ?? 99) - (b.priority ?? 99);
    if (pri !== 0) return pri;

    return String(a.id).localeCompare(String(b.id));
  });

  return due.slice(0, maxPools).map((p) => p.id);
}
