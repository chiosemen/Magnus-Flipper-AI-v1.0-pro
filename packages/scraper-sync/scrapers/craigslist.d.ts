/**
 * Craigslist Scraper
 * Real implementation with pagination and category support
 */
import type { ScraperConfig, ScraperResult } from "../types/ScrapedListing.js";
export declare class CraigslistScraper {
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
     * Build Craigslist search URL
     */
    private buildSearchUrl;
    /**
     * Get Craigslist location subdomain
     */
    private getLocationSubdomain;
    /**
     * Parse price from text
     */
    private parsePrice;
    /**
     * Extract listing ID from Craigslist URL
     */
    private extractListingIdFromUrl;
}
//# sourceMappingURL=craigslist.d.ts.map