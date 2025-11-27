"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Env = void 0;
exports.Env = {
    NODE_ENV: process.env.NODE_ENV ?? "production",
    LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    APP_URL: process.env.APP_URL,
    DEMO_MODE: process.env.DEMO_MODE ?? "false",
    PORT: process.env.PORT ?? "4000",
};
//# sourceMappingURL=env.js.map