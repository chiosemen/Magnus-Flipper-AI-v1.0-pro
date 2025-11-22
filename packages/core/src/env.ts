import { z } from 'zod';

// Base environment schema shared across all services
const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
});

// API-specific environment schema
export const apiEnvSchema = baseEnvSchema.extend({
  PORT: z.string().default('10000'),
  SUPABASE_URL: z.string(),
  SUPABASE_ANON_KEY: z.string(),
});

// Worker-specific environment schema
export const workerEnvSchema = baseEnvSchema.extend({
  SUPABASE_URL: z.string(),
  SUPABASE_ANON_KEY: z.string(),
});

// Telegram bot environment schema
export const botEnvSchema = baseEnvSchema.extend({
  TELEGRAM_BOT_TOKEN: z.string(),
  TELEGRAM_CHAT_ID: z.string().optional(),
});

// Validation helper
export function validateEnv<T extends z.ZodTypeAny>(schema: T): z.infer<T> {
  try {
    return schema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      console.error(error.errors);
      process.exit(1);
    }
    throw error;
  }
}

// Export validated environment configs
export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;
export type BotEnv = z.infer<typeof botEnvSchema>;
