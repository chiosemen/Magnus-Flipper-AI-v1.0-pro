/**
 * Listing Fingerprint v2
 * Enhanced fingerprinting with image hash, NLP title, price anomaly detection
 */
export interface ListingFingerprint {
    contentHash: string;
    imageHash?: string;
    titleHash: string;
    priceHash: string;
    sellerHash: string;
    combinedHash: string;
}
export interface ListingForFingerprint {
    id: string;
    title: string;
    price: number;
    sellerId?: string;
    sellerName?: string;
    imageUrl?: string;
    marketplace: string;
    description?: string;
}
/**
 * Generate comprehensive fingerprint for deduplication
 */
export declare function generateFingerprint(listing: ListingForFingerprint): ListingFingerprint;
/**
 * Check if two listings are likely duplicates
 */
export declare function areDuplicates(fp1: ListingFingerprint, fp2: ListingFingerprint, threshold?: "strict" | "normal" | "loose"): boolean;
/**
 * Deduplicate listings array (optimized)
 * Uses hash-based lookup for O(n) performance instead of O(n²)
 */
export declare function deduplicateListings<T extends ListingForFingerprint>(listings: T[], threshold?: "strict" | "normal" | "loose"): T[];
//# sourceMappingURL=fingerprint.d.ts.map