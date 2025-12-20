/**
 * MM Listing Contract
 * Normalized listing format for MM-Agent UI
 */
export type MMListing = {
    id: string;
    title: string;
    price: number | null;
    currency: "USD" | "GBP";
    location: string;
    marketplace: "facebook";
    url: string;
    imageUrl?: string;
    sellerName?: string;
    scrapedAt: string;
};
/**
 * Normalize Facebook Marketplace listing to MM contract
 */
export declare function normalizeFacebookListing(raw: any, geo: "US" | "UK"): MMListing;
//# sourceMappingURL=mmListing.d.ts.map