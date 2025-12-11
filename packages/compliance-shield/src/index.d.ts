/**
 * Compliance Shield v1.0 - Anti-Bot Evasion & Request Fingerprinting
 * Ensures scrapers respect ToS and avoid detection
 *
 * Features:
 * - Request fingerprinting
 * - Compliance validation
 * - Risk scoring
 * - Adaptive throttling guardrails
 */
import { MarketplaceProfile } from '@magnus-flipper-ai/marketplace-config';
export * from './riskScoring';
export * from './guardrails';
export * from './observability';
export * from './fingerprintManager';
export interface RequestFingerprint {
    userAgent: string;
    acceptLanguage: string;
    acceptEncoding: string;
    viewport: {
        width: number;
        height: number;
    };
    timezone: string;
    locale: string;
    platform: string;
    headers: Record<string, string>;
}
export interface ComplianceConstraints {
    maxRequestsPerDay: number;
    maxConcurrentRequests: number;
    requiresProxy: boolean;
    requiresSession: boolean;
    minDelayBetweenRequests: number;
}
/**
 * Get a random user agent from the pool
 */
export declare function getRandomUserAgent(): string;
/**
 * Generate a unique request fingerprint for anti-detection
 */
export declare function generateFingerprint(profile: MarketplaceProfile): RequestFingerprint;
/**
 * Get compliance constraints for a marketplace
 */
export declare function getComplianceConstraints(profile: MarketplaceProfile): ComplianceConstraints;
/**
 * Validate request compliance before execution
 */
export declare function validateCompliance(profile: MarketplaceProfile, dailyRequestCount: number, hasProxy: boolean, hasSession: boolean): {
    compliant: boolean;
    reason?: string;
};
//# sourceMappingURL=index.d.ts.map