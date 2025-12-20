/**
 * Vinted Scraper
 * Real implementation with API endpoint scraping (Vinted uses GraphQL)
 */
import type { ScraperConfig, ScraperResult } from "../types/ScrapedListing.js";
export declare class VintedScraper {
    private browserManager;
    private config;
    private readonly BASE_URL;
    private readonly API_URL;
    private sessionCookie;
    constructor(config: ScraperConfig);
    /**
     * Main scrape method
     */
    scrape(): Promise<ScraperResult>;
    /**
     * Initialize session by visiting the site and getting cookies
     */
    private initializeSession;
    /**
     * Scrape listings for a specific query using API
     */
    private scrapeQuery;
    /**
     * Fetch listings from Vinted API
     */
    private fetchListingsFromAPI;
    /**
     * Transform Vinted API item to ScrapedListing
     */
    private transformAPIItem;
    /**
     * Parse condition from Vinted status
     */
    private parseCondition;
}
//# sourceMappingURL=vinted.d.ts.map