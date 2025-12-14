/**
 * Ranking Engine v2
 * Velocity scoring, Swoopa-style ranking
 */
export interface ListingForRanking {
    id: string;
    title: string;
    price: number;
    marketplace: string;
    firstSeen: Date;
    lastSeen: Date;
    viewsCount?: number;
    description?: string;
    imageUrl?: string;
    location?: string;
}
export interface RankingScore {
    listingId: string;
    velocityScore: number;
    freshnessScore: number;
    priceScore: number;
    engagementScore: number;
    finalScore: number;
}
/**
 * Calculate velocity score (enhanced)
 * Higher score = listing appeared recently (good for "just posted" deals)
 * Enhanced with multi-factor velocity calculation
 */
export declare function calculateVelocityScore(listing: ListingForRanking): number;
/**
 * Calculate freshness score
 * Based on when listing was last seen
 */
export declare function calculateFreshnessScore(listing: ListingForRanking): number;
/**
 * Calculate price score
 * Lower prices get higher scores (assuming we want deals)
 * Normalized against marketplace average (if available)
 */
export declare function calculatePriceScore(listing: ListingForRanking, marketplaceAvgPrice?: number): number;
/**
 * Calculate engagement score
 * Based on views, interactions, etc.
 */
export declare function calculateEngagementScore(listing: ListingForRanking): number;
/**
 * Calculate final ranking score
 * Weighted combination of all scores
 */
export declare function calculateRankingScore(listing: ListingForRanking, marketplaceAvgPrice?: number, weights?: {
    velocity: number;
    freshness: number;
    price: number;
    engagement: number;
}): RankingScore;
/**
 * Rank listings by score
 */
export declare function rankListings(listings: ListingForRanking[], marketplaceAvgPrices?: Map<string, number>): Array<ListingForRanking & {
    rankingScore: RankingScore;
}>;
//# sourceMappingURL=ranking.d.ts.map