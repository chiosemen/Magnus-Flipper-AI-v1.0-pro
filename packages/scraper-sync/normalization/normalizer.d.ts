/**
 * Normalization Engine
 * Cleans and standardizes scraped listings into unified schema
 */
import type { ScrapedListing, NormalizedListing } from "../types/ScrapedListing.js";
export declare class ListingNormalizer {
    /**
     * Normalize a single listing
     */
    normalize(listing: ScrapedListing): NormalizedListing;
    /**
     * Normalize title: lowercase, remove special chars, trim whitespace
     */
    private normalizeTitle;
    /**
     * Normalize price to USD
     */
    private normalizePrice;
    /**
     * Normalize condition string
     */
    private normalizeCondition;
    /**
     * Generate content hash for deduplication
     * Based on title, price, and marketplace
     */
    private generateContentHash;
    /**
     * Calculate freshness score (0-100)
     * Recently posted listings get higher scores
     */
    private calculateFreshnessScore;
    /**
     * Batch normalize listings
     */
    normalizeAll(listings: ScrapedListing[]): NormalizedListing[];
    /**
     * Detect duplicate listings
     * Returns map of content_hash -> duplicate_group_id
     */
    detectDuplicates(listings: NormalizedListing[]): Map<string, string>;
    /**
     * Detect anomalies (unusually low prices, suspicious patterns)
     */
    detectAnomalies(listings: NormalizedListing[]): void;
    /**
     * Calculate price statistics for anomaly detection
     */
    private calculatePriceStatistics;
}
//# sourceMappingURL=normalizer.d.ts.map