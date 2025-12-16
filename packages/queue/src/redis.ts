import { Redis as IORedis } from "ioredis";

/**
 * Detect if we're in a build/prerender context.
 * 
 * STRATEGY: Assume we're in build mode UNLESS proven otherwise.
 * This is safer than trying to detect build mode explicitly.
 * 
 * Redis should ONLY be used in actual API route handlers at runtime,
 * never during static generation or build analysis.
 */
function isBuildContext(): boolean {
  // If explicitly told to skip Redis, do so
  if (process.env.SKIP_REDIS === "true") return true;
  
  // If NEXT_PHASE is set to build, we're definitely in build
  if (process.env.NEXT_PHASE === "phase-production-build") return true;
  
  // If we're in Next.js build worker
  if (process.env.__NEXT_PRIVATE_PREBUNDLED_REACT) return true;
  
  // DEFAULT: If no Redis URL is configured, assume build context
  // (Production runtime MUST have Redis configured)
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    return true;
  }
  
  return false;
}

/**
 * Lazy Redis connection to prevent build-time instantiation.
 * 
 * CRITICAL BUILD-TIME GUARD:
 * - Never instantiates during `next build`
 * - Never instantiates during static page generation
 * - Only instantiates during actual runtime request handling
 * 
 * Without this guard, Next.js static analysis triggers Redis connection during build,
 * causing ECONNREFUSED errors when Redis isn't available.
 */
let _redis: IORedis | null = null;
let _mockRedis: IORedis | null = null;

function getRedisInstance(): IORedis {
  const inBuild = isBuildContext();
  
  // Log for debugging (will be visible during build if needed)
  if (process.env.DEBUG_REDIS) {
    console.log('[Redis] isBuildContext:', inBuild, {
      SKIP_REDIS: process.env.SKIP_REDIS,
      NEXT_PHASE: process.env.NEXT_PHASE,
      REDIS_URL: !!process.env.REDIS_URL,
      REDIS_HOST: !!process.env.REDIS_HOST,
    });
  }
  
  // EXECUTION CONTEXT GUARD: Return mock during build phase
  if (inBuild) {
    if (!_mockRedis) {
      // Create a comprehensive mock Redis client that doesn't connect
      // This prevents ECONNREFUSED errors during Next.js build phase
      const mockMethods = [
        'connect', 'disconnect', 'quit', 'ping', 'get', 'set', 'del', 'hset',
        'hget', 'hgetall', 'hdel', 'lpush', 'rpush', 'lrange', 'expire',
        'ttl', 'exists', 'keys', 'scan', 'multi', 'exec', 'pipeline',
        'subscribe', 'unsubscribe', 'publish', 'on', 'once', 'off', 'emit'
      ];
      
      const mock: any = {
        status: "end", // Indicate disconnected state
        options: { lazyConnect: true },
        // Make all methods return resolved promises
        ...Object.fromEntries(
          mockMethods.map(method => [method, async (...args: any[]) => mock])
        ),
      };
      
      _mockRedis = mock as IORedis;
    }
    return _mockRedis;
  }

  if (_redis) return _redis;

  // Support Azure Redis (host/port/password/tls) with fallback to REDIS_URL for local development
  _redis = process.env.REDIS_HOST
    ? new IORedis({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT ?? 6380),
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_TLS === "true" ? {} : undefined,
        maxRetriesPerRequest: null,
        lazyConnect: true, // Don't connect until first command
        retryStrategy: (times) => {
          // Don't retry during build
          if (isBuildContext()) return null;
          return Math.min(times * 50, 2000);
        },
      })
    : new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
        maxRetriesPerRequest: null,
        lazyConnect: true, // Don't connect until first command
        retryStrategy: (times) => {
          // Don't retry during build
          if (isBuildContext()) return null;
          return Math.min(times * 50, 2000);
        },
      });

  return _redis;
}

/**
 * Lazy Redis connection using Proxy.
 * All property access and method calls are forwarded to the underlying instance.
 * The instance is only created when first accessed (not at import time).
 */
export const redis = new Proxy({} as IORedis, {
  get(target, prop) {
    const instance = getRedisInstance();
    const value = (instance as any)[prop];
    // Bind methods to the instance to preserve `this` context
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
