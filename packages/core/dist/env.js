"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.botEnvSchema = exports.workerEnvSchema = exports.apiEnvSchema = void 0;
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
// Base environment schema shared across all services
const baseEnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    REDIS_HOST: zod_1.z.string().default('localhost'),
    REDIS_PORT: zod_1.z.string().default('6379'),
});
// API-specific environment schema
exports.apiEnvSchema = baseEnvSchema.extend({
    PORT: zod_1.z.string().default('10000'),
    SUPABASE_URL: zod_1.z.string(),
    SUPABASE_ANON_KEY: zod_1.z.string(),
});
// Worker-specific environment schema
exports.workerEnvSchema = baseEnvSchema.extend({
    SUPABASE_URL: zod_1.z.string(),
    SUPABASE_ANON_KEY: zod_1.z.string(),
});
// Telegram bot environment schema
exports.botEnvSchema = baseEnvSchema.extend({
    TELEGRAM_BOT_TOKEN: zod_1.z.string(),
    TELEGRAM_CHAT_ID: zod_1.z.string().optional(),
});
// Validation helper
function validateEnv(schema) {
    try {
        return schema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error('❌ Environment validation failed:');
            console.error(error.errors);
            process.exit(1);
        }
        throw error;
    }
}
//# sourceMappingURL=env.js.map