import Redis from 'ioredis';
import {
  MarketplaceId,
  getMarketplaceProfile
} from '@magnus-flipper-ai/marketplace-config';

if (!process.env.REDIS_URL) {
  console.warn(
    '[rate-limiter] REDIS_URL is not set. Rate limiting will be disabled (all requests allowed).'
  );
}

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    })
  : null;

export type UserTier = 'STARTER' | 'BASIC' | 'PRO' | 'ULTRA';

interface RateLimitKeyParts {
  marketplace: MarketplaceId;
  ip?: string;
  tier?: UserTier | 'all';
}

function buildKey(parts: RateLimitKeyParts, suffix?: string): string {
  const ip = parts.ip ?? 'shared';
  const tier = parts.tier ?? 'all';
  const base = `rl:${parts.marketplace}:${ip}:${tier}`;
  return suffix ? `${base}:${suffix}` : base;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  burstRemaining?: number;
  burstResetAt?: number;
}

/**
 * Enhanced token-bucket limiter with burst support:
 * - Per-minute rate limit from MarketplaceProfile
 * - Burst window tracking
 * - Adaptive throttling based on success rate
 */
export async function tryConsume(
  parts: RateLimitKeyParts,
  tokens = 1
): Promise<RateLimitResult> {
  const profile = getMarketplaceProfile(parts.marketplace);
  const maxPerMinute = profile.maxRequestsPerMinutePerIp;
  const now = Date.now();

  // No Redis → no enforcement (dev mode)
  if (!redis) {
    return {
      allowed: true,
      remaining: maxPerMinute,
      resetAt: now + 60_000,
      burstRemaining: profile.burstMaxRequests,
      burstResetAt: now + profile.burstWindowSeconds * 1000,
    };
  }

  const key = buildKey(parts);
  const burstKey = buildKey(parts, 'burst');
  const ttlSeconds = 60;
  const burstTtlSeconds = profile.burstWindowSeconds;

  // Check burst limit first
  const burstCurrentRaw = await redis.get(burstKey);
  const burstCurrent = burstCurrentRaw ? Number(burstCurrentRaw) : 0;

  if (burstCurrent + tokens > profile.burstMaxRequests) {
    const burstTtl = await redis.ttl(burstKey);
    const burstResetAt = now + (burstTtl > 0 ? burstTtl * 1000 : burstTtlSeconds * 1000);
    
    return {
      allowed: false,
      remaining: maxPerMinute, // Don't consume main bucket on burst limit
      resetAt: now + ttlSeconds * 1000,
      burstRemaining: Math.max(0, profile.burstMaxRequests - burstCurrent),
      burstResetAt,
    };
  }

  // Check main rate limit
  const currentRaw = await redis.get(key);
  const current = currentRaw ? Number(currentRaw) : 0;

  if (current + tokens > maxPerMinute) {
    const ttl = await redis.ttl(key);
    const resetAt = now + (ttl > 0 ? ttl * 1000 : ttlSeconds * 1000);
    
    return {
      allowed: false,
      remaining: Math.max(0, maxPerMinute - current),
      resetAt,
      burstRemaining: Math.max(0, profile.burstMaxRequests - burstCurrent),
      burstResetAt: now + burstTtlSeconds * 1000,
    };
  }

  // Consume from both buckets
  const newValue = await redis.incrby(key, tokens);
  if (newValue === tokens) {
    await redis.expire(key, ttlSeconds);
  }

  const newBurstValue = await redis.incrby(burstKey, tokens);
  if (newBurstValue === tokens) {
    await redis.expire(burstKey, burstTtlSeconds);
  }

  const ttl = await redis.ttl(key);
  const burstTtl = await redis.ttl(burstKey);
  const resetAt = now + (ttl > 0 ? ttl * 1000 : ttlSeconds * 1000);
  const burstResetAt = now + (burstTtl > 0 ? burstTtl * 1000 : burstTtlSeconds * 1000);

  return {
    allowed: true,
    remaining: maxPerMinute - newValue,
    resetAt,
    burstRemaining: profile.burstMaxRequests - newBurstValue,
    burstResetAt,
  };
}

/**
 * Register exponential backoff with jitter after a 429 / rate-limit response.
 * Uses jitter to prevent thundering herd.
 */
export async function registerBackoff(
  parts: RateLimitKeyParts
): Promise<number> {
  if (!redis) {
    const profile = getMarketplaceProfile(parts.marketplace);
    return profile.recommendedPingIntervalSeconds;
  }

  const profile = getMarketplaceProfile(parts.marketplace);
  const baseKey = buildKey(parts);
  const backoffKey = `${baseKey}:backoff`;

  const existingRaw = await redis.get(backoffKey);
  const existing =
    existingRaw != null
      ? Number(existingRaw)
      : profile.recommendedPingIntervalSeconds;

  // Exponential backoff with cap
  const next = Math.min(
    existing * profile.backoffMultiplierOn429,
    profile.exponentialBackoffMaxSeconds
  );

  // Enhanced exponential jitter: ±20% base + additional random component
  // This creates more natural variation in backoff times
  const baseJitter = next * 0.2 * (Math.random() * 2 - 1); // -20% to +20%
  const exponentialJitter = next * 0.1 * Math.random(); // Additional 0-10% random
  const jitteredNext = Math.max(
    profile.recommendedPingIntervalSeconds,
    Math.floor(next + baseJitter + exponentialJitter)
  );

  await redis.set(
    backoffKey,
    String(jitteredNext),
    'EX',
    profile.cooldownSecondsOn429
  );

  return jitteredNext;
}

/**
 * Get current backoff interval with jitter applied.
 */
export async function getCurrentBackoffSeconds(
  parts: RateLimitKeyParts
): Promise<number> {
  const profile = getMarketplaceProfile(parts.marketplace);

  if (!redis) {
    // Apply jitter to baseline even without Redis
    const jitter = profile.jitterSeconds * (Math.random() * 2 - 1);
    return Math.floor(profile.recommendedPingIntervalSeconds + jitter);
  }

  const baseKey = buildKey(parts);
  const backoffKey = `${baseKey}:backoff`;

  const existingRaw = await redis.get(backoffKey);
  if (!existingRaw) {
    // Apply jitter to baseline
    const jitter = profile.jitterSeconds * (Math.random() * 2 - 1);
    return Math.floor(profile.recommendedPingIntervalSeconds + jitter);
  }

  const val = Number(existingRaw);
  if (Number.isNaN(val)) {
    const jitter = profile.jitterSeconds * (Math.random() * 2 - 1);
    return Math.floor(profile.recommendedPingIntervalSeconds + jitter);
  }

  // Enhanced exponential jitter for existing backoff
  const baseJitter = val * 0.1 * (Math.random() * 2 - 1); // ±10% base
  const exponentialJitter = val * 0.05 * Math.random(); // Additional 0-5% random
  return Math.floor(val + baseJitter + exponentialJitter);
}

/**
 * Adaptive throttling: Adjust rate based on success/failure ratio
 * Returns multiplier (0.5 = 50% of normal rate, 1.0 = 100%, 1.5 = 150%)
 * Now includes guardrails for safety
 */
export async function getAdaptiveThrottleMultiplier(
  parts: RateLimitKeyParts,
  lookbackMinutes = 15
): Promise<number> {
  if (!redis) return 1.0;

  const profile = getMarketplaceProfile(parts.marketplace);
  const baseKey = buildKey(parts);
  const successKey = `${baseKey}:success:${lookbackMinutes}`;
  const failureKey = `${baseKey}:failure:${lookbackMinutes}`;
  const emergencyKey = `${baseKey}:emergency`;

  const [successCount, failureCount, emergencyRaw] = await Promise.all([
    redis.get(successKey).then(v => Number(v) || 0),
    redis.get(failureKey).then(v => Number(v) || 0),
    redis.get(emergencyKey).then(v => v === '1'),
  ]);

  const total = successCount + failureCount;
  if (total === 0) return 1.0;

  const successRate = successCount / total;

  // Calculate base multiplier
  let multiplier = 1.0;
  
  // If success rate is high (>90%), allow slight increase
  if (successRate > 0.9) {
    multiplier = Math.min(1.2, 1.0 + (successRate - 0.9) * 2);
  }
  // If success rate is low (<70%), reduce rate
  else if (successRate < 0.7) {
    multiplier = Math.max(0.5, successRate);
  }

  // Apply guardrails (import dynamically to avoid circular deps)
  try {
    const guardrailsModule = await import('@magnus-flipper-ai/compliance-shield/guardrails');
    const guardrails = guardrailsModule.getGuardrails(profile);
    
    // Check emergency threshold
    if (successRate < guardrails.emergencyThreshold) {
      // Set emergency mode in Redis
      await redis.set(`${baseKey}:emergency`, '1', 'EX', 3600); // 1 hour
      return guardrails.emergencyMultiplier;
    }
    
    // Check recovery threshold
    if (emergencyRaw && successRate >= guardrails.recoveryThreshold) {
      await redis.del(`${baseKey}:emergency`);
      // Continue with normal multiplier calculation
    }
    
    // Apply min/max bounds
    multiplier = Math.max(guardrails.minMultiplier, Math.min(guardrails.maxMultiplier, multiplier));
    
    return multiplier;
  } catch (err) {
    // Fallback if guardrails not available
    console.warn('[rate-limiter] Guardrails not available, using base multiplier:', err);
    return multiplier;
  }
}

/**
 * Record success/failure for adaptive throttling
 */
export async function recordRequestOutcome(
  parts: RateLimitKeyParts,
  success: boolean,
  lookbackMinutes = 15
): Promise<void> {
  if (!redis) return;

  const baseKey = buildKey(parts);
  const key = success
    ? `${baseKey}:success:${lookbackMinutes}`
    : `${baseKey}:failure:${lookbackMinutes}`;

  await redis.incr(key);
  await redis.expire(key, lookbackMinutes * 60);
}
