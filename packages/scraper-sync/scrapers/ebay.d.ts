/**
 * eBay Scraper
 * Real implementation with pagination, filtering, and condition detection
 */
import type { ScraperConfig, ScraperResult } from "../types/ScrapedListing.js";
export declare class EbayScraper {
    private browserManager;
    private config;
    private readonly BASE_URL;
    constructor(config: ScraperConfig);
    /**
     * Main scrape method
     */
    scrape(): Promise<ScraperResult>;
    /**
     * Scrape listings for a specific query
     */
    private scrapeQuery;
    /**
     * Extract listings from current page
     */
    private extractListingsFromPage;
    /**
     * Extract data from a listing element
     */
    private extractListingData;
    /**
     * Build eBay search URL
     */
    private buildSearchUrl;
    /**
     * Parse price from text
     */
    private parsePrice;
    /**
     * Parse condition from text
     */
    private parseCondition;
    /**
     * Parse shipping information
     */
    private parseShipping;
    /**
     * Extract seller ID from seller text
     */
    private extractSellerId;
    /**
     * Extract listing ID from eBay URL
     */
    private extractListingIdFromUrl;
}
//# sourceMappingURL=ebay.d.ts.map