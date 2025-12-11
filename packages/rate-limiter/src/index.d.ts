import { MarketplaceId } from '@magnus-flipper-ai/marketplace-config';
export type UserTier = 'STARTER' | 'BASIC' | 'PRO' | 'ULTRA';
interface RateLimitKeyParts {
    marketplace: MarketplaceId;
    ip?: string;
    tier?: UserTier | 'all';
}
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    burstRemaining?: number;
    burstResetAt?: number;
}
/**
 * Enhanced token-bucket limiter with burst support:
 * - Per-minute rate limit from MarketplaceProfile
 * - Burst window tracking
 * - Adaptive throttling based on success rate
 */
export declare function tryConsume(parts: RateLimitKeyParts, tokens?: number): Promise<RateLimitResult>;
/**
 * Register exponential backoff with jitter after a 429 / rate-limit response.
 * Uses jitter to prevent thundering herd.
 */
export declare function registerBackoff(parts: RateLimitKeyParts): Promise<number>;
/**
 * Get current backoff interval with jitter applied.
 */
export declare function getCurrentBackoffSeconds(parts: RateLimitKeyParts): Promise<number>;
/**
 * Adaptive throttling: Adjust rate based on success/failure ratio
 * Returns multiplier (0.5 = 50% of normal rate, 1.0 = 100%, 1.5 = 150%)
 * Now includes guardrails for safety
 */
export declare function getAdaptiveThrottleMultiplier(parts: RateLimitKeyParts, lookbackMinutes?: number): Promise<number>;
/**
 * Record success/failure for adaptive throttling
 */
export declare function recordRequestOutcome(parts: RateLimitKeyParts, success: boolean, lookbackMinutes?: number): Promise<void>;
export {};
//# sourceMappingURL=index.d.ts.map