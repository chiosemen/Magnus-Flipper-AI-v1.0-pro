"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = void 0;
exports.createUserClient = createUserClient;
/**
 * Supabase database client for API
 */
const supabase_js_1 = require("@supabase/supabase-js");
const core_1 = require("@magnus-flipper-ai/core");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}
// Service role client for server-side operations (bypasses RLS)
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
// Helper to create a user-scoped client
function createUserClient(accessToken) {
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    });
}
core_1.apiLogger.info('Supabase client initialized');
//# sourceMappingURL=db.js.map