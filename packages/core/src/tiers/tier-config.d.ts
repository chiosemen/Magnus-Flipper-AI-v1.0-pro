/**
 * Tier Configuration
 * Defines feature limits for Free and Pro tiers
 */
export type TierName = "free" | "pro";
export interface TierLimits {
    name: TierName;
    displayName: string;
    price: number;
    features: {
        maxSavedSearches: number;
        maxActiveAlerts: number;
        marketplaces: string[];
        emailAlerts: boolean;
        inAppAlerts: boolean;
        apiAccess?: boolean;
        prioritySupport?: boolean;
        customWebhooks?: boolean;
    };
}
/**
 * Tier Definitions
 */
export declare const TIER_CONFIG: Record<TierName, TierLimits>;
/**
 * Get tier limits for a user
 */
export declare function getTierLimits(tier?: TierName): TierLimits;
/**
 * Get user's tier from role
 * Priority: Role > Default (free)
 */
export declare function getUserTier(user: {
    role?: string;
}): TierName;
/**
 * Check if marketplace is allowed for tier
 */
export declare function isMarketplaceAllowed(marketplace: string, tier: TierName): boolean;
/**
 * Error messages for limit violations
 */
export declare const LIMIT_ERRORS: {
    readonly MAX_SEARCHES_REACHED: {
        readonly code: "MAX_SEARCHES_REACHED";
        readonly message: "You've reached the maximum number of saved searches for your plan.";
        readonly upgrade: "Upgrade to Pro to create up to 50 searches.";
    };
    readonly MAX_ALERTS_REACHED: {
        readonly code: "MAX_ALERTS_REACHED";
        readonly message: "You've reached the maximum number of active alerts for your plan.";
        readonly upgrade: "Upgrade to Pro to receive up to 1,000 alerts.";
    };
    readonly MARKETPLACE_NOT_ALLOWED: {
        readonly code: "MARKETPLACE_NOT_ALLOWED";
        readonly message: "This marketplace is not available on your current plan.";
        readonly upgrade: "Upgrade to Pro to access all marketplaces.";
    };
    readonly EMAIL_ALERTS_NOT_ALLOWED: {
        readonly code: "EMAIL_ALERTS_NOT_ALLOWED";
        readonly message: "Email alerts are only available on the Pro plan.";
        readonly upgrade: "Upgrade to Pro to receive email notifications.";
    };
};
/**
 * Format limit error response
 */
export declare function formatLimitError(error: keyof typeof LIMIT_ERRORS, currentTier: TierName): {
    error: "You've reached the maximum number of saved searches for your plan." | "You've reached the maximum number of active alerts for your plan." | "This marketplace is not available on your current plan." | "Email alerts are only available on the Pro plan.";
    errorCode: "MAX_SEARCHES_REACHED" | "MAX_ALERTS_REACHED" | "MARKETPLACE_NOT_ALLOWED" | "EMAIL_ALERTS_NOT_ALLOWED";
    upgrade: "Upgrade to Pro to create up to 50 searches." | "Upgrade to Pro to receive up to 1,000 alerts." | "Upgrade to Pro to access all marketplaces." | "Upgrade to Pro to receive email notifications.";
    currentPlan: string;
    currentLimits: {
        maxSavedSearches: number;
        maxActiveAlerts: number;
    };
    proPlan: {
        displayName: string;
        price: number;
        maxSavedSearches: number;
        maxActiveAlerts: number;
    };
};
//# sourceMappingURL=tier-config.d.ts.map