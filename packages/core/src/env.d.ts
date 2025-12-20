import { z } from 'zod';
export declare const apiEnvSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "debug"]>>;
} & {
    PORT: z.ZodDefault<z.ZodString>;
    SUPABASE_URL: z.ZodString;
    SUPABASE_ANON_KEY: z.ZodString;
}, "strip", z.ZodTypeAny, {
    LOG_LEVEL: "info" | "error" | "warn" | "debug";
    NODE_ENV: "production" | "development" | "test";
    PORT: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
}, {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    LOG_LEVEL?: "info" | "error" | "warn" | "debug" | undefined;
    NODE_ENV?: "production" | "development" | "test" | undefined;
    PORT?: string | undefined;
}>;
export declare const workerEnvSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "debug"]>>;
} & {
    SUPABASE_URL: z.ZodString;
    SUPABASE_ANON_KEY: z.ZodString;
}, "strip", z.ZodTypeAny, {
    LOG_LEVEL: "info" | "error" | "warn" | "debug";
    NODE_ENV: "production" | "development" | "test";
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
}, {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    LOG_LEVEL?: "info" | "error" | "warn" | "debug" | undefined;
    NODE_ENV?: "production" | "development" | "test" | undefined;
}>;
export declare const botEnvSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "debug"]>>;
} & {
    TELEGRAM_BOT_TOKEN: z.ZodString;
    TELEGRAM_CHAT_ID: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    LOG_LEVEL: "info" | "error" | "warn" | "debug";
    NODE_ENV: "production" | "development" | "test";
    TELEGRAM_BOT_TOKEN: string;
    TELEGRAM_CHAT_ID?: string | undefined;
}, {
    TELEGRAM_BOT_TOKEN: string;
    LOG_LEVEL?: "info" | "error" | "warn" | "debug" | undefined;
    NODE_ENV?: "production" | "development" | "test" | undefined;
    TELEGRAM_CHAT_ID?: string | undefined;
}>;
export declare function validateEnv<T extends z.ZodTypeAny>(schema: T): z.infer<T>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;
export type BotEnv = z.infer<typeof botEnvSchema>;
//# sourceMappingURL=env.d.ts.map