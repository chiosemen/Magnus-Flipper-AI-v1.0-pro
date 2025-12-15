import type { Redis } from "ioredis";

/**
 * Circuit Breaker for Dealers
 * 
 * Prevents repeatedly calling dealers that are failing.
 * Uses Redis for distributed state.
 */

export interface CircuitBreakerConfig {
  openAfterFailures: number;
  cooldownMinutes: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  openAfterFailures: 5,
  cooldownMinutes: 15,
};

function getCircuitBreakerKey(dealerId: string): string {
  return `circuit:dealer:${dealerId}`;
}

function getFailureCountKey(dealerId: string): string {
  return `circuit:dealer:failures:${dealerId}`;
}

/**
 * Check if circuit breaker is open for a dealer
 */
export async function isDealerCircuitOpen(
  redis: Redis,
  dealerId: string,
  config: CircuitBreakerConfig = DEFAULT_CONFIG
): Promise<boolean> {
  const key = getCircuitBreakerKey(dealerId);
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
    await redis.del(getFailureCountKey(dealerId));
    return false;
  }
  
  return true; // Circuit is still open
}

/**
 * Record a dealer failure
 */
export async function recordDealerFailure(
  redis: Redis,
  dealerId: string,
  config: CircuitBreakerConfig = DEFAULT_CONFIG
): Promise<void> {
  const failureKey = getFailureCountKey(dealerId);
  
  // Increment failure count
  const count = await redis.incr(failureKey);
  
  // Set expiration on failure count (24 hours)
  await redis.expire(failureKey, 24 * 60 * 60);
  
  // Check if we should open circuit
  if (count >= config.openAfterFailures) {
    const breakerKey = getCircuitBreakerKey(dealerId);
    await redis.set(breakerKey, Date.now().toString());
    await redis.expire(breakerKey, config.cooldownMinutes * 60);
    
    console.warn(`⚠️ Circuit breaker opened for dealer ${dealerId} after ${count} failures`);
  }
}

/**
 * Record a dealer success (reset circuit breaker)
 */
export async function recordDealerSuccess(
  redis: Redis,
  dealerId: string
): Promise<void> {
  const breakerKey = getCircuitBreakerKey(dealerId);
  const failureKey = getFailureCountKey(dealerId);
  
  // Reset both keys
  await redis.del(breakerKey);
  await redis.del(failureKey);
}

