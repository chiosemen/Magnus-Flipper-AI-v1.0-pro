"use strict";
/**
 * Membership tier configuration for Magnus Flipper AI
 *
 * Defines subscription plans and their associated limits for marketplace monitoring features.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_METADATA = exports.PLAN_LIMITS = void 0;
exports.getPlanLimits = getPlanLimits;
exports.isValidPlan = isValidPlan;
exports.getDefaultPlan = getDefaultPlan;
/**
 * Plan tier definitions with their respective limits.
 *
 * - STARTER: Entry-level tier for basic marketplace monitoring
 * - BASIC: Enhanced tier with more frequent checks and capacity
 * - PREMIUM: Professional tier with high-frequency monitoring
 * - ULTRA: Maximum tier for power users and professionals
 */
exports.PLAN_LIMITS = {
    STARTER: {
        maxSavedSearches: 3,
        maxActiveSearches: 1,
        maxResultsPerRun: 10,
        minRunIntervalMinutes: 60, // effectively once per hour
    },
    BASIC: {
        maxSavedSearches: 10,
        maxActiveSearches: 5,
        maxResultsPerRun: 20,
        minRunIntervalMinutes: 30, // every 30 minutes
    },
    PREMIUM: {
        maxSavedSearches: 30,
        maxActiveSearches: 20,
        maxResultsPerRun: 50,
        minRunIntervalMinutes: 10, // every 10 minutes
    },
    ULTRA: {
        maxSavedSearches: 100,
        maxActiveSearches: 100,
        maxResultsPerRun: 100,
        minRunIntervalMinutes: 5, // every 5 minutes
    },
};
/**
 * Get plan limits for a given subscription tier
 * @param plan - The subscription plan
 * @returns Plan limits configuration
 */
function getPlanLimits(plan) {
    return exports.PLAN_LIMITS[plan];
}
/**
 * Check if a subscription plan is valid
 * @param plan - The plan string to validate
 * @returns True if the plan is a valid SubscriptionPlan
 */
function isValidPlan(plan) {
    return ['STARTER', 'BASIC', 'PREMIUM', 'ULTRA'].includes(plan);
}
/**
 * Get the default subscription plan for new users
 * @returns The default subscription plan
 */
function getDefaultPlan() {
    return 'STARTER';
}
/**
 * Display metadata for each plan tier
 */
exports.PLAN_METADATA = {
    STARTER: {
        name: 'STARTER',
        displayName: 'Starter',
        description: 'Perfect for casual flippers getting started',
    },
    BASIC: {
        name: 'BASIC',
        displayName: 'Basic',
        description: 'Great for regular marketplace monitoring',
        price: {
            monthly: 9.99,
            yearly: 99.99,
            currency: 'USD',
        },
    },
    PREMIUM: {
        name: 'PREMIUM',
        displayName: 'Premium',
        description: 'Professional tier for serious flippers',
        price: {
            monthly: 29.99,
            yearly: 299.99,
            currency: 'USD',
        },
    },
    ULTRA: {
        name: 'ULTRA',
        displayName: 'Ultra',
        description: 'Maximum power for professional resellers',
        price: {
            monthly: 79.99,
            yearly: 799.99,
            currency: 'USD',
        },
    },
};
//# sourceMappingURL=plans.js.map