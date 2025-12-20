/**
 * Tier Service
 * Handles tier checks and limit enforcement
 */
/**
 * Get user with tier info
 */
export declare function getUserWithTier(userId: string): Promise<any>;
/**
 * Check if user can create a new search
 */
export declare function canCreateSearch(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    currentCount?: number;
    limit?: number;
}>;
/**
 * Check if user has reached alert limit
 */
export declare function canReceiveAlert(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    currentCount?: number;
    limit?: number;
}>;
/**
 * Check if user can access marketplace
 */
export declare function canAccessMarketplace(userId: string, marketplace: string): Promise<{
    allowed: boolean;
    reason?: string;
}>;
/**
 * Check if user can receive email alerts
 */
export declare function canReceiveEmailAlerts(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
}>;
/**
 * Get usage stats for user
 */
export declare function getUserUsageStats(userId: string): Promise<{
    tier: any;
    limits: any;
    usage: {
        savedSearches: {
            current: any;
            limit: any;
            percentage: number;
        };
        activeAlerts: {
            current: any;
            limit: any;
            percentage: number;
        };
    };
} | null>;
//# sourceMappingURL=tier-service.d.ts.map