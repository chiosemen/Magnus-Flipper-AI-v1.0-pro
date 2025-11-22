import { z } from 'zod';
export declare const apiEnvSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "debug"]>>;
    REDIS_HOST: z.ZodDefault<z.ZodString>;
    REDIS_PORT: z.ZodDefault<z.ZodString>;
} & {
    PORT: z.ZodDefault<z.ZodString>;
    SUPABASE_URL: z.ZodString;
    SUPABASE_ANON_KEY: z.ZodString;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    REDIS_HOST: string;
    REDIS_PORT: string;
    PORT: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
}, {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    LOG_LEVEL?: "error" | "warn" | "info" | "debug" | undefined;
    REDIS_HOST?: string | undefined;
    REDIS_PORT?: string | undefined;
    PORT?: string | undefined;
}>;
export declare const workerEnvSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "debug"]>>;
    REDIS_HOST: z.ZodDefault<z.ZodString>;
    REDIS_PORT: z.ZodDefault<z.ZodString>;
} & {
    SUPABASE_URL: z.ZodString;
    SUPABASE_ANON_KEY: z.ZodString;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    REDIS_HOST: string;
    REDIS_PORT: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
}, {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    LOG_LEVEL?: "error" | "warn" | "info" | "debug" | undefined;
    REDIS_HOST?: string | undefined;
    REDIS_PORT?: string | undefined;
}>;
export declare const botEnvSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "debug"]>>;
    REDIS_HOST: z.ZodDefault<z.ZodString>;
    REDIS_PORT: z.ZodDefault<z.ZodString>;
} & {
    TELEGRAM_BOT_TOKEN: z.ZodString;
    TELEGRAM_CHAT_ID: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    REDIS_HOST: string;
    REDIS_PORT: string;
    TELEGRAM_BOT_TOKEN: string;
    TELEGRAM_CHAT_ID?: string | undefined;
}, {
    TELEGRAM_BOT_TOKEN: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    LOG_LEVEL?: "error" | "warn" | "info" | "debug" | undefined;
    REDIS_HOST?: string | undefined;
    REDIS_PORT?: string | undefined;
    TELEGRAM_CHAT_ID?: string | undefined;
}>;
export declare function validateEnv<T extends z.ZodTypeAny>(schema: T): z.infer<T>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;
export type BotEnv = z.infer<typeof botEnvSchema>;
//# sourceMappingURL=env.d.ts.map