import { redis } from "@magnus-flipper-ai/queue";

type AcquireOpts = { ttlMs: number; limit: number };

const ACQUIRE_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, 0, now - ttl)
local count = redis.call('ZCARD', key)
if count >= limit then
  return 0
end

redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, ttl)
return 1
`;

/**
 * Redis semaphore implemented as a ZSET of active leases with TTL.
 *
 * This function is atomic via Lua script to avoid race conditions under high concurrency.
 *
 * NOTE: We intentionally do not require explicit release; leases expire naturally.
 */
export async function acquireSemaphore(
  key: string,
  { ttlMs, limit }: AcquireOpts
): Promise<boolean> {
  const now = Date.now();
  const member = `${now}-${Math.random().toString(16).slice(2)}`;

  const result = await (redis as any).eval(
    ACQUIRE_LUA,
    1,
    key,
    String(now),
    String(ttlMs),
    String(limit),
    member
  );

  return Number(result) === 1;
}

export async function releaseSemaphore(_key: string) {
  // No-op by design: rely on TTL expiry of leases.
  return;
}

