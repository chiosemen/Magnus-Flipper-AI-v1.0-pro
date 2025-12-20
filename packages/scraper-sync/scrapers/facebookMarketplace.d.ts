/**
 * Facebook Marketplace Scraper
 * Real implementation with login flow, dynamic scrolling, and pagination
 */
import type { ScraperConfig, ScraperResult } from "../types/ScrapedListing.js";
export declare class FacebookMarketplaceScraper {
    private browserManager;
    private config;
    constructor(config: ScraperConfig);
    /**
     * Main scrape method
     */
    scrape(): Promise<ScraperResult>;
    /**
     * Login to Facebook
     */
    private login;
    /**
     * Scrape listings for a specific query
     */
    private scrapeQuery;
    /**
     * Build Facebook Marketplace search URL
     */
    private buildSearchUrl;
    /**
     * Infinite scroll to load items
     */
    private infiniteScrollLoadItems;
    /**
     * Extract data from a listing element
     */
    private extractListingData;
    /**
     * Parse price from text
     */
    private parsePrice;
    /**
     * Extract seller ID from Facebook URL
     */
    private extractSellerIdFromUrl;
}
//# sourceMappingURL=facebookMarketplace.d.ts.map