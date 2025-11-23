/**
 * Membership tier configuration for Magnus Flipper AI
 *
 * Defines subscription plans and their associated limits for marketplace monitoring features.
 */
export type SubscriptionPlan = "STARTER" | "BASIC" | "PREMIUM" | "ULTRA";
export interface PlanLimits {
    /** Maximum number of saved searches a user can create */
    maxSavedSearches: number;
    /** Maximum number of active (running) searches at once */
    maxActiveSearches: number;
    /** Maximum results returned per alert run */
    maxResultsPerRun: number;
    /** Minimum interval in minutes between alert runs (effectively throttles alert frequency) */
    minRunIntervalMinutes: number;
}
/**
 * Plan tier definitions with their respective limits.
 *
 * - STARTER: Entry-level tier for basic marketplace monitoring
 * - BASIC: Enhanced tier with more frequent checks and capacity
 * - PREMIUM: Professional tier with high-frequency monitoring
 * - ULTRA: Maximum tier for power users and professionals
 */
export declare const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits>;
/**
 * Get plan limits for a given subscription tier
 * @param plan - The subscription plan
 * @returns Plan limits configuration
 */
export declare function getPlanLimits(plan: SubscriptionPlan): PlanLimits;
/**
 * Check if a subscription plan is valid
 * @param plan - The plan string to validate
 * @returns True if the plan is a valid SubscriptionPlan
 */
export declare function isValidPlan(plan: string): plan is SubscriptionPlan;
/**
 * Get the default subscription plan for new users
 * @returns The default subscription plan
 */
export declare function getDefaultPlan(): SubscriptionPlan;
/**
 * Plan metadata for display purposes
 */
export interface PlanMetadata {
    name: string;
    displayName: string;
    description: string;
    price?: {
        monthly: number;
        yearly: number;
        currency: string;
    };
}
/**
 * Display metadata for each plan tier
 */
export declare const PLAN_METADATA: Record<SubscriptionPlan, PlanMetadata>;
//# sourceMappingURL=plans.d.ts.map