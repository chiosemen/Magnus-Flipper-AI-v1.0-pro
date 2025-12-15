import type Redis from "ioredis";
import type { Tier } from "@magnus-flipper-ai/ingest-registry";
import { estimateCostPerRun, getDefaultEstimatedMinutes } from "@magnus-flipper-ai/apify-adapter";

/**
 * Get Redis key for daily spend tracking
 */
function getDailySpendKey(tier: Tier, date: Date = new Date()): string {
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
  return `cost:daily:${tier}:${dateStr}`;
}

/**
 * Get Redis key for per-search spend tracking
 */
function getSearchSpendKey(jobId: string): string {
  return `cost:search:${jobId}`;
}

/**
 * Check if daily budget would be exceeded
 */
export async function checkDailyBudget(
  redis: Redis,
  tier: Tier,
  estimatedCostUSD: number,
  dailyBudgetUSD: number
): Promise<{ allowed: boolean; currentSpend: number; remaining: number }> {
  const key = getDailySpendKey(tier);
  const currentSpend = parseFloat((await redis.get(key)) || "0");
  const newTotal = currentSpend + estimatedCostUSD;
  
  return {
    allowed: newTotal <= dailyBudgetUSD,
    currentSpend,
    remaining: Math.max(0, dailyBudgetUSD - currentSpend),
  };
}

/**
 * Record spend for a job
 */
export async function recordSpend(
  redis: Redis,
  tier: Tier,
  costUSD: number,
  jobId?: string
): Promise<void> {
  const dailyKey = getDailySpendKey(tier);
  
  // Increment daily spend
  await redis.incrbyfloat(dailyKey, costUSD);
  await redis.expire(dailyKey, 24 * 60 * 60); // Expire after 24 hours
  
  // Record per-search spend if jobId provided
  if (jobId) {
    const searchKey = getSearchSpendKey(jobId);
    await redis.incrbyfloat(searchKey, costUSD);
    await redis.expire(searchKey, 7 * 24 * 60 * 60); // Expire after 7 days
  }
}

/**
 * Get current daily spend for a tier
 */
export async function getDailySpend(
  redis: Redis,
  tier: Tier
): Promise<number> {
  const key = getDailySpendKey(tier);
  return parseFloat((await redis.get(key)) || "0");
}

/**
 * Check if per-search budget would be exceeded
 */
export async function checkSearchBudget(
  redis: Redis,
  jobId: string,
  estimatedCostUSD: number,
  maxBudgetUSD: number
): Promise<{ allowed: boolean; currentSpend: number; remaining: number }> {
  const key = getSearchSpendKey(jobId);
  const currentSpend = parseFloat((await redis.get(key)) || "0");
  const newTotal = currentSpend + estimatedCostUSD;
  
  return {
    allowed: newTotal <= maxBudgetUSD,
    currentSpend,
    remaining: Math.max(0, maxBudgetUSD - currentSpend),
  };
}

/**
 * Estimate cost for an Apify run based on marketplace
 */
export function estimateApifyCost(marketplace: string): number {
  const estimatedMinutes = getDefaultEstimatedMinutes(marketplace);
  return estimateCostPerRun(estimatedMinutes, true);
}

