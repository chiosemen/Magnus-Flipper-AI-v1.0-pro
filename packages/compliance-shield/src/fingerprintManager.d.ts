/**
 * Fingerprint Manager
 * Manages request fingerprint rotation and signature mutation
 * CPU-efficient, tracks fingerprints per marketplace
 */
import { MarketplaceProfile, MarketplaceId } from '@magnus-flipper-ai/marketplace-config';
import { RequestFingerprint } from './index';
/**
 * Get or generate a fingerprint with signature mutation
 * Rotates fingerprints based on use count and time
 */
export declare function getFingerprintWithMutation(marketplace: MarketplaceId, profile: MarketplaceProfile): RequestFingerprint;
/**
 * Clear fingerprint cache for a marketplace (useful for testing)
 */
export declare function clearFingerprintCache(marketplace?: MarketplaceId): void;
/**
 * Get fingerprint statistics (for monitoring)
 */
export declare function getFingerprintStats(): Record<string, {
    count: number;
    avgUseCount: number;
}>;
//# sourceMappingURL=fingerprintManager.d.ts.map