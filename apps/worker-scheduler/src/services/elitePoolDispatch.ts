/**
 * Elite Pool Dispatch Service
 * 
 * Dispatches Elite pool scraping jobs after governance checks pass.
 * Maps pool configurations to actual scraping jobs and enqueues them.
 */

import type { GovernedElitePool } from "./elitePoolGovernance";
import { ingestQueue } from "@magnus-flipper-ai/queue";
import type { ScrapeJob } from "@magnus-flipper-ai/queue";

const WORKER_ID = process.env.WORKER_ID || "worker-scheduler";

/**
 * Map Elite pool ID to search query/category
 */
function getPoolSearchQuery(poolId: string, region: string): string {
  if (poolId.includes("phones")) {
    return "phones";
  }
  if (poolId.includes("electronics")) {
    return "electronics";
  }
  // Default fallback
  return "items";
}

/**
 * Dispatch Elite pool scraping jobs
 * 
 * @param governedPools - Pools that passed governance checks
 * @returns Number of jobs dispatched
 */
export async function dispatchElitePools(
  governedPools: GovernedElitePool[]
): Promise<number> {
  const activePools = governedPools.filter((p) => !p.shouldSkip);
  
  if (activePools.length === 0) {
    console.log(`[${WORKER_ID}] ⏸️  No active Elite pools to dispatch`);
    return 0;
  }

  console.log(`[${WORKER_ID}] 🚀 Dispatching ${activePools.length} Elite pool(s)...`);

  const jobs: ScrapeJob[] = [];
  const now = Date.now();

  for (const pool of activePools) {
    const query = getPoolSearchQuery(pool.poolId, pool.region);
    const jobId = `elite-${pool.poolId}-${now}`;
    
    // Map MarketplaceId to Marketplace type (only facebook/vinted/ebay/gumtree/depop supported)
    const marketplaceMap: Record<string, "facebook" | "vinted" | "ebay" | "gumtree" | "depop"> = {
      facebook: "facebook",
      vinted: "vinted",
      ebay: "ebay",
      gumtree: "gumtree",
      depop: "depop",
    };
    
    const marketplace = marketplaceMap[pool.marketplace];
    if (!marketplace) {
      console.warn(`[${WORKER_ID}] ⚠️  Skipping pool ${pool.poolId}: marketplace ${pool.marketplace} not supported by queue`);
      continue;
    }
    
    // Map pool to scrape job
    const job: ScrapeJob = {
      jobId,
      marketplace,
      query,
      region: pool.region,
      page: 1,
      batchSize: 50, // Standard batch size for Elite pools
      tier: "premium", // Use "premium" as closest tier to "elite"
      traceId: `elite-pool-${pool.poolId}-${now}`,
    };

    jobs.push(job);
    
    console.log(
      `[${WORKER_ID}]   ✅ DISPATCH: ${pool.poolId} → ${pool.marketplace}/${pool.region} (query: "${query}", cadence: ${pool.effectiveCadenceMinutes}min)`
    );
  }

  // Enqueue all jobs
  try {
    await ingestQueue.addBulk(
      jobs.map((data) => ({
        name: `elite-pool:${data.marketplace}:${data.region}`,
        data,
      }))
    );

    console.log(`[${WORKER_ID}] ✅ Successfully enqueued ${jobs.length} Elite pool job(s)`);
    return jobs.length;
  } catch (error) {
    console.error(`[${WORKER_ID}] ❌ Failed to enqueue Elite pool jobs:`, error);
    throw error;
  }
}

/**
 * DEV OVERRIDE: Force dispatch all enabled pools regardless of governance
 * Set DEV_POOL_FORCE=true to bypass governance checks
 */
export async function forceDispatchAllElitePools(): Promise<number> {
  const { getEnabledElitePools } = await import("@magnus-flipper-ai/marketplace-config");
  const enabledPools = getEnabledElitePools();
  
  console.log(`[${WORKER_ID}] 🔧 DEV MODE: Force dispatching ${enabledPools.length} enabled pool(s)...`);
  
  // Convert to governed pools format (all allowed)
  const governedPools: GovernedElitePool[] = enabledPools.map((pool) => ({
    ...pool,
    originalCadenceMinutes: pool.cadenceMinutes,
    effectiveCadenceMinutes: pool.cadenceMinutes,
    shouldSkip: false,
  }));
  
  return await dispatchElitePools(governedPools);
}

