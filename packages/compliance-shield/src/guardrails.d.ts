/**
 * Adaptive Throttling Guardrails
 * Safety limits and enforcement for adaptive throttling
 */
import { MarketplaceProfile } from '@magnus-flipper-ai/marketplace-config';
export interface ThrottleGuardrail {
    minMultiplier: number;
    maxMultiplier: number;
    emergencyThreshold: number;
    emergencyMultiplier: number;
    recoveryThreshold: number;
    cooldownPeriod: number;
    latencyP95ThresholdMs: number;
    errorRateThreshold: number;
}
export interface GuardrailViolation {
    type: 'min' | 'max' | 'emergency' | 'recovery';
    message: string;
    recommendedMultiplier: number;
}
/**
 * Get guardrails for a marketplace profile
 */
export declare function getGuardrails(profile: MarketplaceProfile): ThrottleGuardrail;
/**
 * Apply guardrails to throttle multiplier
 * Returns clamped multiplier and any violations
 */
export declare function applyGuardrails(profile: MarketplaceProfile, proposedMultiplier: number, successRate: number, metrics?: {
    p95LatencyMs?: number;
    errorRate?: number;
}, isEmergencyMode?: boolean): {
    multiplier: number;
    violations: GuardrailViolation[];
    emergencyMode: boolean;
};
/**
 * Calculate safe throttle multiplier with guardrails
 */
export declare function calculateSafeThrottleMultiplier(profile: MarketplaceProfile, baseMultiplier: number, successRate: number, metrics?: {
    p95LatencyMs?: number;
    errorRate?: number;
}, isEmergencyMode?: boolean): number;
/**
 * Check if rate increase is safe (after cooldown)
 */
export declare function canIncreaseRate(profile: MarketplaceProfile, lastIncreaseTime: number, currentSuccessRate: number): boolean;
//# sourceMappingURL=guardrails.d.ts.map