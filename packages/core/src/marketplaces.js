/**
 * Marketplace Profiles
 * Centralized marketplace configuration for Magnus Flipper AI
 */
export const MARKETPLACE_PROFILES = [
    {
        name: "eBay",
        slug: "ebay",
        tagline: "Auctions, snipes & mispriced stock",
        refresh: "Every 30s",
        marketplaceId: "ebay",
    },
    {
        name: "Amazon",
        slug: "amazon",
        tagline: "Retail arbitrage & FBA flips",
        refresh: "Every 60s",
        marketplaceId: "amazon",
    },
    {
        name: "Facebook Marketplace",
        slug: "facebook",
        tagline: "Local steals before anyone else",
        refresh: "Every 45s",
        marketplaceId: "facebook",
    },
    {
        name: "Craigslist",
        slug: "craigslist",
        tagline: "Big-ticket local arbitrage",
        refresh: "Every 90s",
        marketplaceId: "craigslist",
    },
    {
        name: "Vinted",
        slug: "vinted",
        tagline: "European fashion & lifestyle deals",
        refresh: "Every 60s",
        marketplaceId: "vinted",
    },
    {
        name: "Gumtree",
        slug: "gumtree",
        tagline: "Hidden UK classifieds value",
        refresh: "Every 90s",
        marketplaceId: "gumtree",
    },
];
/**
 * Get marketplace profile by slug
 */
export function getMarketplaceBySlug(slug) {
    return MARKETPLACE_PROFILES.find((m) => m.slug === slug);
}
/**
 * Get marketplace profile by marketplaceId
 */
export function getMarketplaceById(marketplaceId) {
    return MARKETPLACE_PROFILES.find((m) => m.marketplaceId === marketplaceId);
}
//# sourceMappingURL=marketplaces.js.map