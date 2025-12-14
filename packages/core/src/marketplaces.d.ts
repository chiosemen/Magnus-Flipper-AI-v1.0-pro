/**
 * Marketplace Profiles
 * Centralized marketplace configuration for Magnus Flipper AI
 */
export interface MarketplaceProfile {
    name: string;
    slug: string;
    icon?: string;
    tagline: string;
    refresh: string;
    marketplaceId: string;
}
export declare const MARKETPLACE_PROFILES: MarketplaceProfile[];
/**
 * Get marketplace profile by slug
 */
export declare function getMarketplaceBySlug(slug: string): MarketplaceProfile | undefined;
/**
 * Get marketplace profile by marketplaceId
 */
export declare function getMarketplaceById(marketplaceId: string): MarketplaceProfile | undefined;
//# sourceMappingURL=marketplaces.d.ts.map