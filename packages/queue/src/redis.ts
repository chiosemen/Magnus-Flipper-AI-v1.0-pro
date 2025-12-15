import IORedis from "ioredis";

// Support Azure Redis (host/port/password/tls) with fallback to REDIS_URL for local development
export const redis = process.env.REDIS_HOST
  ? new IORedis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT ?? 6380),
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_TLS === "true" ? {} : undefined,
      maxRetriesPerRequest: null,
    })
  : new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
