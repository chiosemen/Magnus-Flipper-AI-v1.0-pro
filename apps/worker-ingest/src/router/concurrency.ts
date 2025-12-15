import type Redis from "ioredis";
import type { Marketplace } from "@magnus-flipper-ai/queue";
import type { Tier, StrategyRegistry } from "@magnus-flipper-ai/ingest-registry";

/**
 * Get Redis key for marketplace concurrency tracking
 */
function getMarketplaceConcurrencyKey(marketplace: string): string {
  return `concurrency:marketplace:${marketplace}`;
}

/**
 * Get Redis key for global Apify concurrency tracking
 */
function getGlobalApifyConcurrencyKey(): string {
  return "concurrency:global:apify";
}

/**
 * Acquire concurrency slot for a marketplace
 */
export async function acquireMarketplaceSlot(
  redis: Redis,
  marketplace: string,
  maxConcurrency: number
): Promise<boolean> {
  const key = getMarketplaceConcurrencyKey(marketplace);
  const current = await redis.incr(key);
  
  // Set expiration (1 hour) to prevent stale counts
  await redis.expire(key, 3600);
  
  if (current > maxConcurrency) {
    // Release slot if we exceeded limit
    await redis.decr(key);
    return false;
  }
  
  return true;
}

/**
 * Release concurrency slot for a marketplace
 */
export async function releaseMarketplaceSlot(
  redis: Redis,
  marketplace: string
): Promise<void> {
  const key = getMarketplaceConcurrencyKey(marketplace);
  const current = await redis.decr(key);
  
  // Don't let it go negative
  if (current < 0) {
    await redis.set(key, "0");
  }
}

/**
 * Acquire global Apify concurrency slot
 */
export async function acquireApifySlot(
  redis: Redis,
  maxConcurrency: number
): Promise<boolean> {
  const key = getGlobalApifyConcurrencyKey();
  const current = await redis.incr(key);
  
  // Set expiration (1 hour)
  await redis.expire(key, 3600);
  
  if (current > maxConcurrency) {
    await redis.decr(key);
    return false;
  }
  
  return true;
}

/**
 * Release global Apify concurrency slot
 */
export async function releaseApifySlot(redis: Redis): Promise<void> {
  const key = getGlobalApifyConcurrencyKey();
  const current = await redis.decr(key);
  
  if (current < 0) {
    await redis.set(key, "0");
  }
}

/**
 * Get current concurrency for a marketplace
 */
export async function getMarketplaceConcurrency(
  redis: Redis,
  marketplace: string
): Promise<number> {
  const key = getMarketplaceConcurrencyKey(marketplace);
  return parseInt((await redis.get(key)) || "0", 10);
}

/**
 * Get current global Apify concurrency
 */
export async function getGlobalApifyConcurrency(redis: Redis): Promise<number> {
  const key = getGlobalApifyConcurrencyKey();
  return parseInt((await redis.get(key)) || "0", 10);
}

