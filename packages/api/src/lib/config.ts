import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

/**
 * Environment variable schema with validation
 * Fails fast on startup if required vars are missing
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default("4000"),

  // Supabase (required for production)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE: z.string().min(20).optional(),
  SUPABASE_ANON_KEY: z.string().min(20).optional(),

  // Redis (optional, for rate limiting)
  REDIS_URL: z.string().url().optional(),

  // Monitoring (optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENV: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default("60000"),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default("100"),
});

/**
 * Validated and typed configuration object
 */
export type Config = z.infer<typeof envSchema>;

let config: Config;

try {
  config = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("❌ Invalid environment variables:");
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join(".")}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

// Warn if database not configured
if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE) {
  console.warn(
    "⚠️  Warning: Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE in .env"
  );
}

// Warn if Redis not configured (rate limiting won't work)
if (!config.REDIS_URL) {
  console.warn(
    "⚠️  Warning: Redis not configured. Rate limiting will use in-memory store (not suitable for production)"
  );
}

export { config };

/**
 * Helper to check if app is in production
 */
export const isProduction = () => config.NODE_ENV === "production";

/**
 * Helper to check if database is configured
 */
export const isDatabaseConfigured = () =>
  Boolean(config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE);

/**
 * Helper to check if Redis is configured
 */
export const isRedisConfigured = () => Boolean(config.REDIS_URL);
