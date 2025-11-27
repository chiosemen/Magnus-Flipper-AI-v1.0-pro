"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Env = void 0;
exports.Env = {
    NODE_ENV: process.env.NODE_ENV ?? "production",
    LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};
//# sourceMappingURL=env.js.map