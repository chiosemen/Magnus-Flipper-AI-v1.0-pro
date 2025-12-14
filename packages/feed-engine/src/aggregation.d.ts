/**
 * Feed Aggregation Layer
 * Combines listings from multiple marketplaces with deduplication and ranking
 */
import { type ListingForRanking, type RankingScore } from "./ranking";
import { type ListingForFingerprint } from "./fingerprint";
export interface AggregatedListing extends ListingForRanking, ListingForFingerprint {
    rankingScore: RankingScore;
    fingerprint: {
        contentHash: string;
        combinedHash: string;
    };
}
export interface AggregationOptions {
    deduplicate?: boolean;
    deduplicationThreshold?: "strict" | "normal" | "loose";
    rank?: boolean;
    marketplaceAvgPrices?: Map<string, number>;
    limit?: number;
    offset?: number;
}
/**
 * Aggregate listings from multiple marketplaces (optimized)
 * Improved performance with early fingerprint generation and marketplace-aware merging
 */
export declare function aggregateListings(listings: Array<ListingForRanking & ListingForFingerprint>, options?: AggregationOptions): AggregatedListing[];
/**
 * Calculate marketplace average prices
 */
export declare function calculateMarketplaceAvgPrices(listings: Array<{
    marketplace: string;
    price: number;
}>): Map<string, number>;
//# sourceMappingURL=aggregation.d.ts.map