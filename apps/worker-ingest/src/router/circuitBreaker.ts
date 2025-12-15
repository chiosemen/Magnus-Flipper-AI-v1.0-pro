import type { Marketplace } from "@magnus-flipper-ai/queue";
import type Redis from "ioredis";

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  openAfterFailures: number; // Open circuit after N failures
  cooldownMinutes: number; // Cooldown period after opening
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  openAfterFailures: 8,
  cooldownMinutes: 30,
};

/**
 * Get Redis key for circuit breaker state
 */
function getCircuitBreakerKey(marketplace: string): string {
  return `circuit:breaker:${marketplace}`;
}

/**
 * Get Redis key for failure count
 */
function getFailureCountKey(marketplace: string): string {
  return `circuit:failures:${marketplace}`;
}

/**
 * Check if circuit breaker is open for a marketplace
 */
export async function isCircuitOpen(
  redis: Redis,
  marketplace: Marketplace,
  config: CircuitBreakerConfig = DEFAULT_CONFIG
): Promise<boolean> {
  const key = getCircuitBreakerKey(marketplace);
  const state = await redis.get(key);
  
  if (!state) {
    return false; // Circuit is closed
  }
  
  // Check if cooldown period has passed
  const openedAt = parseInt(state, 10);
  const cooldownMs = config.cooldownMinutes * 60 * 1000;
  const now = Date.now();
  
  if (now - openedAt > cooldownMs) {
    // Cooldown expired, reset circuit
    await redis.del(key);
    await redis.del(getFailureCountKey(marketplace));
    return false;
  }
  
  return true; // Circuit is still open
}

/**
 * Record a failure and potentially open circuit breaker
 */
export async function recordFailure(
  redis: Redis,
  marketplace: Marketplace,
  config: CircuitBreakerConfig = DEFAULT_CONFIG
): Promise<void> {
  const failureKey = getFailureCountKey(marketplace);
  
  // Increment failure count
  const count = await redis.incr(failureKey);
  
  // Set expiration on failure count (24 hours)
  await redis.expire(failureKey, 24 * 60 * 60);
  
  // Check if we should open circuit
  if (count >= config.openAfterFailures) {
    const breakerKey = getCircuitBreakerKey(marketplace);
    await redis.set(breakerKey, Date.now().toString());
    await redis.expire(breakerKey, config.cooldownMinutes * 60);
    
    console.warn(
      `⚠️ Circuit breaker opened for ${marketplace} after ${count} failures`
    );
  }
}

/**
 * Record a success and reset circuit breaker
 */
export async function recordSuccess(
  redis: Redis,
  marketplace: Marketplace
): Promise<void> {
  const breakerKey = getCircuitBreakerKey(marketplace);
  const failureKey = getFailureCountKey(marketplace);
  
  // Reset both keys
  await redis.del(breakerKey);
  await redis.del(failureKey);
}

/**
 * Get current failure count for a marketplace
 */
export async function getFailureCount(
  redis: Redis,
  marketplace: Marketplace
): Promise<number> {
  const key = getFailureCountKey(marketplace);
  const count = await redis.get(key);
  return count ? parseInt(count, 10) : 0;
}

