import type Redis from "ioredis";
// Prisma types - use local definitions if @prisma/client is not generated
import type { PrismaClient } from "../types/prisma.js";
import type { Marketplace } from "@magnus-flipper-ai/queue";
import { loadRegistry, getMarketplaceConfig, getGlobalLimits } from "@magnus-flipper-ai/ingest-registry";
import type { IngestJobPayload, RoutingDecision, RouterDependencies } from "./types.js";
import { isCircuitOpen, recordFailure, recordSuccess } from "./circuitBreaker.js";
import {
  checkDailyBudget,
  estimateApifyCost,
  checkSearchBudget,
} from "./costGuards.js";
import {
  acquireMarketplaceSlot,
  releaseMarketplaceSlot,
  acquireApifySlot,
  releaseApifySlot,
} from "./concurrency.js";
import { FEATURE_FLAGS } from "../config/featureFlags.js";

/**
 * Load registry at module level (singleton)
 */
let registry: ReturnType<typeof loadRegistry> | null = null;

function getRegistry() {
  if (!registry) {
    registry = loadRegistry();
  }
  return registry;
}

/**
 * Main routing decision function
 * 
 * Determines execution strategy (local/apify/hybrid) based on:
 * - Registry configuration
 * - Circuit breaker state
 * - Concurrency limits
 * - Cost guards
 */
export async function decideRoute(
  deps: RouterDependencies,
  payload: IngestJobPayload
): Promise<RoutingDecision> {
  const { redis } = deps;
  const { marketplace, tier = "free" } = payload;
  
  const reg = getRegistry();
  const marketplaceConfig = getMarketplaceConfig(reg, marketplace);
  const globalLimits = getGlobalLimits(reg);
  
  if (!marketplaceConfig) {
    // Unknown marketplace, default to local
    return {
      strategy: "local",
      reason: `Unknown marketplace: ${marketplace}, defaulting to local`,
    };
  }
  
  const { strategy: configuredStrategy, actorId, concurrency } = marketplaceConfig;
  const maxMarketplaceConcurrency = concurrency[tier];
  const maxApifyConcurrency = globalLimits.apifyConcurrency[tier];
  const dailyBudgetUSD = globalLimits.dailyApifyBudgetUSD[tier];
  
  // Check circuit breaker first
  const circuitOpen = await isCircuitOpen(redis, marketplace);
  if (circuitOpen && (configuredStrategy === "apify" || configuredStrategy === "hybrid")) {
    // Circuit is open, fallback to local
    return {
      strategy: "local",
      reason: `Circuit breaker open for ${marketplace}, falling back to local`,
    };
  }
  
  // If strategy is local, no further checks needed
  if (configuredStrategy === "local") {
    // Still check concurrency for local scrapers
    const acquired = await acquireMarketplaceSlot(redis, marketplace, maxMarketplaceConcurrency);
    if (!acquired) {
      return {
        strategy: "local",
        reason: `Marketplace concurrency limit reached for ${marketplace}`,
      };
    }
    
    return {
      strategy: "local",
      reason: `Registry configured ${marketplace} for local scraping`,
    };
  }
  
  // For Apify or hybrid strategies, check concurrency and cost
  if (configuredStrategy === "apify" || configuredStrategy === "hybrid") {
    // Check global Apify concurrency
    const apifySlotAcquired = await acquireApifySlot(redis, maxApifyConcurrency);
    if (!apifySlotAcquired) {
      // Fallback to local if Apify concurrency is full
      return {
        strategy: "local",
        reason: `Global Apify concurrency limit reached (${maxApifyConcurrency} for ${tier} tier)`,
      };
    }
    
    // Check marketplace-specific concurrency
    const marketplaceSlotAcquired = await acquireMarketplaceSlot(
      redis,
      marketplace,
      maxMarketplaceConcurrency
    );
    if (!marketplaceSlotAcquired) {
      // Release Apify slot since we can't proceed
      await releaseApifySlot(redis);
      return {
        strategy: "local",
        reason: `Marketplace concurrency limit reached for ${marketplace}`,
      };
    }
    
    // Estimate cost
    const estimatedCost = estimateApifyCost(marketplace);
    
    // Check daily budget
    const dailyBudgetCheck = await checkDailyBudget(
      redis,
      tier,
      estimatedCost,
      dailyBudgetUSD
    );
    
    if (!dailyBudgetCheck.allowed) {
      // Release slots
      await releaseApifySlot(redis);
      await releaseMarketplaceSlot(redis, marketplace);
      
      return {
        strategy: "local",
        reason: `Daily Apify budget exceeded ($${dailyBudgetCheck.currentSpend.toFixed(2)} / $${dailyBudgetUSD})`,
      };
    }
    
    // Check per-search budget (optional, can be configured per job)
    // For now, we'll allow it but could add per-search limits later
    
    // All checks passed, return configured strategy
    return {
      strategy: configuredStrategy,
      actorId: actorId!,
      reason: `Using ${configuredStrategy} strategy for ${marketplace} (tier: ${tier})`,
    };
  }
  
  // Fallback (shouldn't reach here)
  return {
    strategy: "local",
    reason: "Fallback to local strategy",
  };
}

/**
 * Release concurrency slots after job completion/failure
 */
export async function releaseSlots(
  redis: Redis,
  marketplace: Marketplace,
  strategy: "local" | "apify" | "hybrid"
): Promise<void> {
  await releaseMarketplaceSlot(redis, marketplace);
  
  if (strategy === "apify" || strategy === "hybrid") {
    await releaseApifySlot(redis);
  }
}

/**
 * Update circuit breaker on success
 */
export async function onApifySuccess(
  redis: Redis,
  marketplace: Marketplace
): Promise<void> {
  await recordSuccess(redis, marketplace);
}

/**
 * Update circuit breaker on failure
 */
export async function onApifyFailure(
  redis: Redis,
  marketplace: Marketplace,
  openAfterFailures: number = 8,
  cooldownMinutes: number = 30
): Promise<void> {
  await recordFailure(redis, marketplace, {
    openAfterFailures,
    cooldownMinutes,
  });
}

