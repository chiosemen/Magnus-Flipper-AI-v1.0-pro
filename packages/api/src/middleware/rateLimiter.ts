import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { createClient } from "redis";
import { config, isRedisConfigured } from "../lib/config.ts";
import { logger } from "../lib/logger.ts";

/**
 * Redis client for rate limiting (optional)
 * Disabled for serverless deployment - using in-memory store
 */
let redisClient: ReturnType<typeof createClient> | null = null;

// Don't connect to Redis in serverless environment (Vercel)
// Rate limiting will use in-memory store instead
if (false && isRedisConfigured()) {
  redisClient = createClient({
    url: config.REDIS_URL,
  });

  redisClient.connect().catch((err) => {
    logger.error({ err }, "Failed to connect to Redis for rate limiting");
    redisClient = null;
  });

  redisClient.on("error", (err) => {
    logger.error({ err }, "Redis client error");
  });
}

/**
 * Standard rate limiter for API endpoints
 * 100 requests per minute by default
 */
export const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: "Too Many Requests",
    message: "You have exceeded the request limit. Please try again later.",
    retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000),
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  store: redisClient
    ? new RedisStore({
        // @ts-expect-error - Known type mismatch between redis@4 and rate-limit-redis
        sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
      })
    : undefined, // Falls back to memory store if Redis not available
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health" || req.path === "/metrics";
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    const user = (req as any).user;
    if (user?.id) {
      return `user:${user.id}`;
    }
    return req.ip || req.socket.remoteAddress || "unknown";
  },
});

/**
 * Stricter rate limiter for expensive operations
 * 20 requests per minute
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    error: "Too Many Requests",
    message: "This endpoint has stricter rate limits. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient
    ? new RedisStore({
        // @ts-expect-error - Known type mismatch
        sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
        prefix: "strict:",
      })
    : undefined,
  keyGenerator: (req) => {
    const user = (req as any).user;
    if (user?.id) {
      return `user:${user.id}`;
    }
    return req.ip || req.socket.remoteAddress || "unknown";
  },
});

/**
 * Very strict limiter for authentication endpoints
 * 5 requests per 15 minutes (prevent brute force)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: "Too Many Requests",
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful auth attempts
  store: redisClient
    ? new RedisStore({
        // @ts-expect-error - Known type mismatch
        sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
        prefix: "auth:",
      })
    : undefined,
});

/**
 * Cleanup function to close Redis connection
 */
export const closeRateLimitStore = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info("Redis connection closed");
  }
};
