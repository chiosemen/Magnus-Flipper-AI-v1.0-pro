import Redis from 'ioredis';
import {
  MarketplaceId,
  getMarketplaceProfile
} from '@magnus-flipper-ai/marketplace-config';

if (!process.env.REDIS_URL) {
  // You can make this stricter if you prefer
  console.warn(
    '[rate-limiter] REDIS_URL is not set. Rate limiting will be disabled (all requests allowed).'
  );
}

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;

export type UserTier = 'STARTER' | 'BASIC' | 'PRO' | 'ULTRA';

interface RateLimitKeyParts {
  marketplace: MarketplaceId;
  ip?: string;
  tier?: UserTier | 'all';
}

function buildKey(parts: RateLimitKeyParts): string {
  const ip = parts.ip ?? 'shared';
  const tier = parts.tier ?? 'all';
  return `rl:${parts.marketplace}:${ip}:${tier}`;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Token-bucket-ish limiter:
 * - maxRequestsPerMinutePerIp from MarketplaceProfile
 * - 60s window
 */
export async function tryConsume(
  parts: RateLimitKeyParts,
  tokens = 1
): Promise<RateLimitResult> {
  const profile = getMarketplaceProfile(parts.marketplace);
  const maxPerMinute = profile.maxRequestsPerMinutePerIp;
  const now = Date.now();

  // No Redis → no enforcement
  if (!redis) {
    return {
      allowed: true,
      remaining: maxPerMinute,
      resetAt: now + 60_000
    };
  }

  const key = buildKey(parts);
  const ttlSeconds = 60;
  const currentRaw = await redis.get(key);
  const current = currentRaw ? Number(currentRaw) : 0;

  if (current + tokens > maxPerMinute) {
    const ttl = await redis.ttl(key);
    const resetAt =
      now + (ttl > 0 ? ttl * 1000 : ttlSeconds * 1000);
    return {
      allowed: false,
      remaining: Math.max(0, maxPerMinute - current),
      resetAt
    };
  }

  const newValue = await redis.incrby(key, tokens);
  if (newValue === tokens) {
    await redis.expire(key, ttlSeconds);
  }

  const ttl = await redis.ttl(key);
  const resetAt =
    now + (ttl > 0 ? ttl * 1000 : ttlSeconds * 1000);

  return {
    allowed: true,
    remaining: maxPerMinute - newValue,
    resetAt
  };
}

/**
 * Register an explicit backoff after a 429 / rate-limit response.
 * This doesn't block by itself but lets your scheduler
 * consult a "cooldown" interval.
 */
export async function registerBackoff(
  parts: RateLimitKeyParts
): Promise<void> {
  if (!redis) return;

  const profile = getMarketplaceProfile(parts.marketplace);
  const baseKey = buildKey(parts);
  const backoffKey = `${baseKey}:backoff`;

  const existingRaw = await redis.get(backoffKey);
  const existing =
    existingRaw != null
      ? Number(existingRaw)
      : profile.recommendedPingIntervalSeconds;

  const next = Math.min(
    existing * profile.backoffMultiplierOn429,
    3600 // hard cap: 1 hour
  );

  await redis.set(
    backoffKey,
    String(next),
    'EX',
    profile.cooldownSecondsOn429
  );
}

/**
 * Optional helper for schedulers: get current backoff interval
 * (or the profile baseline if none set).
 */
export async function getCurrentBackoffSeconds(
  parts: RateLimitKeyParts
): Promise<number> {
  const profile = getMarketplaceProfile(parts.marketplace);

  if (!redis) {
    return profile.recommendedPingIntervalSeconds;
  }

  const baseKey = buildKey(parts);
  const backoffKey = `${baseKey}:backoff`;

  const existingRaw = await redis.get(backoffKey);
  if (!existingRaw) {
    return profile.recommendedPingIntervalSeconds;
  }

  const val = Number(existingRaw);
  if (Number.isNaN(val)) {
    return profile.recommendedPingIntervalSeconds;
  }

  return val;
}
