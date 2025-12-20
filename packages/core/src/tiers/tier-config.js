/**
 * Tier Configuration
 * Defines feature limits for Free and Pro tiers
 */
/**
 * Tier Definitions
 */
export const TIER_CONFIG = {
    free: {
        name: "free",
        displayName: "Free",
        price: 0,
        features: {
            maxSavedSearches: 3,
            maxActiveAlerts: 10,
            marketplaces: ["facebook", "vinted"],
            emailAlerts: false,
            inAppAlerts: true,
        },
    },
    pro: {
        name: "pro",
        displayName: "Pro",
        price: 29,
        features: {
            maxSavedSearches: 50,
            maxActiveAlerts: 1000,
            marketplaces: ["facebook", "vinted"],
            emailAlerts: true,
            inAppAlerts: true,
            apiAccess: false, // Future
            prioritySupport: true, // Future
        },
    },
};
/**
 * Get tier limits for a user
 */
export function getTierLimits(tier = "free") {
    return TIER_CONFIG[tier] || TIER_CONFIG.free;
}
/**
 * Get user's tier from role
 * Priority: Role > Default (free)
 */
export function getUserTier(user) {
    // Check role (for manual assignments)
    if (user.role) {
        if (user.role === "pro" || user.role === "premium" || user.role === "admin") {
            return "pro";
        }
    }
    // Default to free
    return "free";
}
/**
 * Check if marketplace is allowed for tier
 */
export function isMarketplaceAllowed(marketplace, tier) {
    const limits = getTierLimits(tier);
    return limits.features.marketplaces.includes(marketplace.toLowerCase());
}
/**
 * Error messages for limit violations
 */
export const LIMIT_ERRORS = {
    MAX_SEARCHES_REACHED: {
        code: "MAX_SEARCHES_REACHED",
        message: "You've reached the maximum number of saved searches for your plan.",
        upgrade: "Upgrade to Pro to create up to 50 searches.",
    },
    MAX_ALERTS_REACHED: {
        code: "MAX_ALERTS_REACHED",
        message: "You've reached the maximum number of active alerts for your plan.",
        upgrade: "Upgrade to Pro to receive up to 1,000 alerts.",
    },
    MARKETPLACE_NOT_ALLOWED: {
        code: "MARKETPLACE_NOT_ALLOWED",
        message: "This marketplace is not available on your current plan.",
        upgrade: "Upgrade to Pro to access all marketplaces.",
    },
    EMAIL_ALERTS_NOT_ALLOWED: {
        code: "EMAIL_ALERTS_NOT_ALLOWED",
        message: "Email alerts are only available on the Pro plan.",
        upgrade: "Upgrade to Pro to receive email notifications.",
    },
};
/**
 * Format limit error response
 */
export function formatLimitError(error, currentTier) {
    const errorDetails = LIMIT_ERRORS[error];
    const currentLimits = getTierLimits(currentTier);
    const proLimits = getTierLimits("pro");
    return {
        error: errorDetails.message,
        errorCode: errorDetails.code,
        upgrade: errorDetails.upgrade,
        currentPlan: currentLimits.displayName,
        currentLimits: {
            maxSavedSearches: currentLimits.features.maxSavedSearches,
            maxActiveAlerts: currentLimits.features.maxActiveAlerts,
        },
        proPlan: {
            displayName: proLimits.displayName,
            price: proLimits.price,
            maxSavedSearches: proLimits.features.maxSavedSearches,
            maxActiveAlerts: proLimits.features.maxActiveAlerts,
        },
    };
}
//# sourceMappingURL=tier-config.js.map