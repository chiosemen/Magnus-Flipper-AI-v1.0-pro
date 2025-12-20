/**
 * Feed Contracts
 *
 * Core contracts for feed data structures.
 * These are the minimal interfaces that core defines.
 * feed-engine implements these contracts.
 *
 * NO IMPORTS FROM feed-engine ALLOWED HERE.
 */
/**
 * Base feed listing contract
 * This is what core defines - feed-engine extends this
 */
export interface FeedListing {
    id: string;
    title: string;
    price: number;
    marketplace: string;
    firstSeen: Date | string;
    lastSeen: Date | string;
    viewsCount?: number;
    description?: string;
    imageUrl?: string;
    location?: string;
    sellerId?: string;
    sellerName?: string;
    url?: string;
    currency?: string;
}
/**
 * Feed item with ranking metadata (extended by feed-engine)
 */
export interface FeedItem extends FeedListing {
    rankingScore?: {
        listingId: string;
        velocityScore: number;
        freshnessScore: number;
        priceScore: number;
        engagementScore: number;
        finalScore: number;
    };
    fingerprint?: {
        contentHash: string;
        combinedHash: string;
    };
}
/**
 * Feed batch contract
 */
export interface FeedBatch {
    requestId: string;
    marketplace: string;
    items: FeedItem[];
}
//# sourceMappingURL=feed.d.ts.map