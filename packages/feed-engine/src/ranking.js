/**
 * Ranking Engine v2
 * Velocity scoring, Swoopa-style ranking
 */
/**
 * Calculate velocity score (enhanced)
 * Higher score = listing appeared recently (good for "just posted" deals)
 * Enhanced with multi-factor velocity calculation
 */
export function calculateVelocityScore(listing) {
    const now = new Date();
    const firstSeen = listing.firstSeen instanceof Date ? listing.firstSeen : new Date(listing.firstSeen);
    const lastSeen = listing.lastSeen instanceof Date ? listing.lastSeen : new Date(listing.lastSeen);
    // Time since first seen (in hours)
    const hoursSinceFirstSeen = (now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60);
    // Time since last seen (in hours)
    const hoursSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);
    // Enhanced velocity calculation with multiple factors
    let velocityScore = 100;
    // Factor 1: Recency boost (last seen)
    if (hoursSinceLastSeen < 1) {
        // Very recent (last hour) = maximum boost
        velocityScore = 100 + (1 - hoursSinceLastSeen) * 25; // Up to 125
    }
    else if (hoursSinceLastSeen < 6) {
        // Recent (last 6 hours) = high score
        velocityScore = 100 - (hoursSinceLastSeen - 1) * 10; // Decay from 100 to 50
    }
    else if (hoursSinceLastSeen < 24) {
        // Last 24 hours = moderate score
        velocityScore = Math.max(30, 50 - (hoursSinceLastSeen - 6) * 1.1); // Decay from 50 to 30
    }
    else {
        // Older than 24 hours = exponential decay
        velocityScore = Math.max(0, 30 * Math.exp(-(hoursSinceLastSeen - 24) / 48));
    }
    // Factor 2: First-seen velocity (new listings get bonus)
    // Reuse hoursSinceFirstSeen calculated above
    if (hoursSinceFirstSeen < 2) {
        // Brand new listing (first 2 hours) = additional 10% boost
        velocityScore *= 1.1;
    }
    // Factor 3: Update frequency (if lastSeen is much later than firstSeen, it's active)
    const updateFrequency = hoursSinceFirstSeen > 0
        ? (hoursSinceLastSeen - hoursSinceFirstSeen) / hoursSinceFirstSeen
        : 0;
    if (updateFrequency > 0.5) {
        // Listing has been updated recently relative to first seen = active listing
        velocityScore *= 1.05;
    }
    return Math.min(125, Math.max(0, velocityScore));
}
/**
 * Calculate freshness score
 * Based on when listing was last seen
 */
export function calculateFreshnessScore(listing) {
    const now = new Date();
    const lastSeen = listing.lastSeen instanceof Date ? listing.lastSeen : new Date(listing.lastSeen);
    const hoursSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);
    // Freshness: 100 for < 1 hour, decays to 0 over 7 days
    if (hoursSinceLastSeen < 1)
        return 100;
    if (hoursSinceLastSeen > 168)
        return 0; // 7 days
    return Math.max(0, 100 * (1 - hoursSinceLastSeen / 168));
}
/**
 * Calculate price score
 * Lower prices get higher scores (assuming we want deals)
 * Normalized against marketplace average (if available)
 */
export function calculatePriceScore(listing, marketplaceAvgPrice) {
    const price = listing.price;
    if (marketplaceAvgPrice) {
        // Score based on discount from average
        const discountPercent = ((marketplaceAvgPrice - price) / marketplaceAvgPrice) * 100;
        // 0% discount = 50, 50% discount = 100, -50% (overpriced) = 0
        return Math.max(0, Math.min(100, 50 + discountPercent));
    }
    // Without average, use absolute price tiers
    // Lower price = higher score (up to $1000, then decays)
    if (price <= 50)
        return 100;
    if (price <= 100)
        return 90;
    if (price <= 250)
        return 75;
    if (price <= 500)
        return 60;
    if (price <= 1000)
        return 40;
    // Above $1000, score decays
    return Math.max(0, 40 * (1 - (price - 1000) / 5000));
}
/**
 * Calculate engagement score
 * Based on views, interactions, etc.
 */
export function calculateEngagementScore(listing) {
    const views = listing.viewsCount || 0;
    // Low views = higher score (less competition, better deal opportunity)
    // High views = lower score (likely already popular/competitive)
    if (views === 0)
        return 100;
    if (views < 10)
        return 90;
    if (views < 50)
        return 70;
    if (views < 100)
        return 50;
    if (views < 500)
        return 30;
    return Math.max(0, 30 * (1 - (views - 500) / 1000));
}
/**
 * Calculate final ranking score
 * Weighted combination of all scores
 */
export function calculateRankingScore(listing, marketplaceAvgPrice, weights = {
    velocity: 0.3,
    freshness: 0.25,
    price: 0.3,
    engagement: 0.15,
}) {
    const velocityScore = calculateVelocityScore(listing);
    const freshnessScore = calculateFreshnessScore(listing);
    const priceScore = calculatePriceScore(listing, marketplaceAvgPrice);
    const engagementScore = calculateEngagementScore(listing);
    const finalScore = velocityScore * weights.velocity +
        freshnessScore * weights.freshness +
        priceScore * weights.price +
        engagementScore * weights.engagement;
    return {
        listingId: listing.id,
        velocityScore,
        freshnessScore,
        priceScore,
        engagementScore,
        finalScore: Math.round(finalScore * 100) / 100, // Round to 2 decimals
    };
}
/**
 * Rank listings by score
 */
export function rankListings(listings, marketplaceAvgPrices) {
    const ranked = listings.map((listing) => {
        const avgPrice = marketplaceAvgPrices?.get(listing.marketplace);
        const rankingScore = calculateRankingScore(listing, avgPrice);
        return {
            ...listing,
            rankingScore,
        };
    });
    // Sort by final score (descending)
    ranked.sort((a, b) => b.rankingScore.finalScore - a.rankingScore.finalScore);
    return ranked;
}
//# sourceMappingURL=ranking.js.map