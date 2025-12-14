/**
 * Feed Aggregation Layer
 * Combines listings from multiple marketplaces with deduplication and ranking
 */
import { rankListings } from "./ranking";
import { deduplicateListings, generateFingerprint } from "./fingerprint";
/**
 * Aggregate listings from multiple marketplaces (optimized)
 * Improved performance with early fingerprint generation and marketplace-aware merging
 */
export function aggregateListings(listings, options = {}) {
    const { deduplicate = true, deduplicationThreshold = "normal", rank = true, marketplaceAvgPrices, limit, offset = 0, } = options;
    // Early return for empty input
    if (listings.length === 0) {
        return [];
    }
    let processed = [...listings];
    // Step 1: Pre-generate fingerprints (used in both deduplication and final output)
    const fingerprintCache = new Map();
    for (const listing of processed) {
        if (!fingerprintCache.has(listing.id)) {
            fingerprintCache.set(listing.id, generateFingerprint(listing));
        }
    }
    // Step 2: Deduplication (optimized with hash-based lookup)
    if (deduplicate) {
        processed = deduplicateListings(processed, deduplicationThreshold);
    }
    // Step 3: Marketplace-aware merging (prioritize listings from multiple marketplaces)
    // Group by fingerprint to find cross-marketplace listings
    const byFingerprint = new Map();
    for (const listing of processed) {
        const fp = fingerprintCache.get(listing.id);
        const key = fp.combinedHash;
        if (!byFingerprint.has(key)) {
            byFingerprint.set(key, []);
        }
        byFingerprint.get(key).push(listing);
    }
    // For cross-marketplace duplicates, keep the one with best price or most recent
    const merged = [];
    for (const [hash, duplicates] of byFingerprint.entries()) {
        if (duplicates.length === 1) {
            merged.push(duplicates[0]);
        }
        else {
            // Multiple marketplaces - pick best one
            // Prefer: lower price, then more recent, then more marketplaces
            duplicates.sort((a, b) => {
                if (a.price !== b.price)
                    return a.price - b.price; // Lower price first
                if (a.lastSeen.getTime() !== b.lastSeen.getTime()) {
                    return b.lastSeen.getTime() - a.lastSeen.getTime(); // More recent first
                }
                return 0;
            });
            merged.push(duplicates[0]); // Keep the best one
        }
    }
    processed = merged;
    // Step 4: Ranking
    if (rank) {
        const ranked = rankListings(processed, marketplaceAvgPrices);
        processed = ranked.map((item) => ({
            ...item,
            rankingScore: item.rankingScore,
        }));
    }
    else {
        // Add default ranking scores if not ranking
        processed = processed.map((item) => ({
            ...item,
            rankingScore: {
                listingId: item.id,
                velocityScore: 50,
                freshnessScore: 50,
                priceScore: 50,
                engagementScore: 50,
                finalScore: 50,
            },
        }));
    }
    // Step 5: Add fingerprints (use cache)
    const withFingerprints = processed.map((listing) => {
        const fp = fingerprintCache.get(listing.id);
        return {
            ...listing,
            fingerprint: {
                contentHash: fp.contentHash,
                combinedHash: fp.combinedHash,
            },
        };
    });
    // Step 6: Pagination (optimized - apply after all processing)
    let paginated = withFingerprints;
    if (offset > 0) {
        paginated = paginated.slice(offset);
    }
    if (limit && limit > 0) {
        paginated = paginated.slice(0, limit);
    }
    return paginated;
}
/**
 * Calculate marketplace average prices
 */
export function calculateMarketplaceAvgPrices(listings) {
    const byMarketplace = new Map();
    for (const listing of listings) {
        if (!byMarketplace.has(listing.marketplace)) {
            byMarketplace.set(listing.marketplace, []);
        }
        byMarketplace.get(listing.marketplace).push(listing.price);
    }
    const averages = new Map();
    for (const [marketplace, prices] of byMarketplace.entries()) {
        const sum = prices.reduce((a, b) => a + b, 0);
        const avg = sum / prices.length;
        averages.set(marketplace, avg);
    }
    return averages;
}
//# sourceMappingURL=aggregation.js.map