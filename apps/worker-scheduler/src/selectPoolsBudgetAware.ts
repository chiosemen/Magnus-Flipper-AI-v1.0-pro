import { getApifyBudgetStatus } from "@magnus-flipper-ai/budget";
import { getSupabase } from "./services/supabase";
import { selectPoolsForRefresh } from "./selectPools";
import { getWorkerRegionFromEnv } from "./region";

/**
 * Budget-aware selector wrapper.
 *
 * - HARD cap: stop normal scraping (optionally allow priority=1 pools)
 * - SOFT cap: reduce concurrency to conserve spend
 * - OK: use full selector capacity
 */
export async function selectPoolsForRefreshBudgetAware({
  maxPools,
}: {
  maxPools: number;
}): Promise<string[]> {
  const budget = await getApifyBudgetStatus();
  const region = getWorkerRegionFromEnv();

  if (budget.state === "HARD") {
    if (!budget.allowCriticalAfterHard) return [];

    const limit = Math.max(1, Math.floor(maxPools / 2));
    let criticalQuery = getSupabase()
      .from("deal_pools")
      .select("id,next_run_at")
      .eq("marketplace", "facebook")
      .eq("enabled", true)
      .eq("status", "healthy")
      .eq("priority", 1);

    if (region) {
      criticalQuery = criticalQuery.eq("region", region);
    }

    const { data: critical, error } = await criticalQuery.limit(Math.max(10, limit * 4));

    if (error) {
      console.error("[fb-pool-scheduler] Failed to load critical pools", error);
      return [];
    }

    const nowMs = Date.now();
    const due = (critical ?? [])
      .filter((row: any) => {
        if (!row?.next_run_at) return true;
        const nextMs = new Date(row.next_run_at).getTime();
        return !Number.isFinite(nextMs) || nextMs <= nowMs;
      })
      .map((p: any) => String(p.id))
      .sort();

    return due.slice(0, limit);
  }

  const effectiveMaxPools =
    budget.state === "SOFT" ? Math.max(1, Math.floor(maxPools / 2)) : maxPools;

  return selectPoolsForRefresh({ maxPools: effectiveMaxPools });
}
