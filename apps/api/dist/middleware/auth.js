"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const db_1 = require("../lib/db");
const core_1 = require("@magnus-flipper-ai/core");
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing or invalid authorization header' });
            return;
        }
        const token = authHeader.substring(7);
        const { data: { user }, error, } = await db_1.supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            core_1.apiLogger.warn('Auth failed', { error: error?.message });
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }
        // Fetch additional user details from database including subscription info
        const { data: userDetails, error: userError } = await db_1.supabaseAdmin
            .from('users')
            .select('stripe_customer_id, subscription_plan, subscription_status, trial_expires_at')
            .eq('id', user.id)
            .single();
        if (userError) {
            core_1.apiLogger.warn('Failed to fetch user details', { error: userError.message, userId: user.id });
        }
        // Attach user info to request
        req.user = {
            id: user.id,
            email: user.email || null,
            stripe_customer_id: userDetails?.stripe_customer_id || null,
            subscription_plan: userDetails?.subscription_plan || 'TRIAL',
            subscription_status: userDetails?.subscription_status || null,
            trial_expires_at: userDetails?.trial_expires_at || null,
        };
        req.accessToken = token;
        next();
    }
    catch (err) {
        core_1.apiLogger.error('Auth middleware error', { error: err });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.requireAuth = requireAuth;
//# sourceMappingURL=auth.js.map