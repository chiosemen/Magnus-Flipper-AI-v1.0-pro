import { Redis } from '@upstash/redis';

let testRedis: Redis | null = null;

/**
 * Get Redis client for tests
 * Uses TEST_REDIS_URL if set, otherwise creates in-memory stub
 */
export function getTestRedisClient(): Redis {
  if (testRedis) {
    return testRedis;
  }

  const testRedisUrl = process.env.TEST_REDIS_URL;
  
  if (testRedisUrl) {
    // Parse Redis URL (redis://localhost:6380)
    const url = new URL(testRedisUrl);
    testRedis = new Redis({
      url: testRedisUrl,
      token: 'test-token', // Upstash format, but for local Redis we can use dummy
    });
  } else {
    // Fallback to in-memory stub
    testRedis = createInMemoryRedis();
  }

  return testRedis;
}

/**
 * Create in-memory Redis stub for unit tests
 */
function createInMemoryRedis(): Redis {
  const store = new Map<string, { value: any; expiresAt?: number }>();

  return {
    get: async (key: string) => {
      const item = store.get(key);
      if (!item) return null;
      if (item.expiresAt && item.expiresAt < Date.now()) {
        store.delete(key);
        return null;
      }
      return item.value;
    },
    set: async (key: string, value: any, options?: { ex?: number }) => {
      const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : undefined;
      store.set(key, { value, expiresAt });
      return 'OK';
    },
    del: async (key: string) => {
      const existed = store.has(key);
      store.delete(key);
      return existed ? 1 : 0;
    },
  } as any;
}

/**
 * Clean all test keys from Redis
 */
export async function cleanupTestRedis(prefix = 'test:') {
  const redis = getTestRedisClient();
  
  // Note: Upstash Redis doesn't support KEYS in serverless mode
  // For tests, we'll track keys manually or use a test prefix
  // This is a simplified version - in production tests, use a dedicated test Redis instance
}

/**
 * Clear all keys matching a pattern (for test cleanup)
 */
export async function clearTestKeys(pattern: string) {
  const redis = getTestRedisClient();
  
  // In a real implementation with local Redis, you'd use:
  // const keys = await redis.keys(pattern);
  // if (keys.length > 0) await redis.del(...keys);
  
  // For Upstash/serverless, we track keys in test setup/teardown
}

