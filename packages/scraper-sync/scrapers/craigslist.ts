/**
 * Craigslist Scraper
 * Real implementation with pagination and category support
 */

import { Page } from "playwright";
import { BrowserManager } from "../utils/browserManager.js";
import type {
  ScrapedListing,
  ScraperConfig,
  ScraperResult,
} from "../types/ScrapedListing.js";

export class CraigslistScraper {
  private browserManager: BrowserManager;
  private config: ScraperConfig;
  private readonly BASE_URL = "https://www.craigslist.org";

  constructor(config: ScraperConfig) {
    this.browserManager = new BrowserManager();
    this.config = config;
  }

  /**
   * Main scrape method
   */
  async scrape(): Promise<ScraperResult> {
    const startTime = Date.now();
    const result: ScraperResult = {
      marketplace: "craigslist",
      success: false,
      listings: [],
      total_scraped: 0,
      errors: [],
      started_at: new Date().toISOString(),
      completed_at: "",
      duration_ms: 0,
    };

    let page: Page | null = null;

    try {
      await this.browserManager.launch(this.config);
      const context = await this.browserManager.createContext(this.config);
      page = await this.browserManager.createPage(context);

      // Determine location subdomain
      const locationSubdomain = this.getLocationSubdomain(
        this.config.location || "newyork"
      );

      // Scrape each search query
      for (const query of this.config.search_queries) {
        try {
          const listings = await this.scrapeQuery(
            page,
            query,
            locationSubdomain
          );
          result.listings.push(...listings);
        } catch (error: any) {
          result.errors.push(
            `Error scraping query "${query}": ${error.message}`
          );
        }
      }

      result.total_scraped = result.listings.length;
      result.success = result.listings.length > 0;
    } catch (error: any) {
      result.errors.push(`Craigslist scraper error: ${error.message}`);
    } finally {
      if (page) {
        await page.close();
      }
      await this.browserManager.close();

      result.completed_at = new Date().toISOString();
      result.duration_ms = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Scrape listings for a specific query
   */
  private async scrapeQuery(
    page: Page,
    query: string,
    locationSubdomain: string
  ): Promise<ScrapedListing[]> {
    const listings: ScrapedListing[] = [];

    // Iterate through pages
    for (let pageNum = 0; pageNum < this.config.max_pages; pageNum++) {
      const searchUrl = this.buildSearchUrl(
        query,
        locationSubdomain,
        pageNum * 120
      );

      try {
        await page.goto(searchUrl, { waitUntil: "networkidle" });
        await this.browserManager.randomDelay(1000, 2000);

        // Extract listings from current page
        const pageListings = await this.extractListingsFromPage(page);
        listings.push(...pageListings);

        if (pageListings.length === 0) {
          // No more results
          break;
        }

        await this.browserManager.randomDelay(
          this.config.delay_min_ms,
          this.config.delay_max_ms
        );
      } catch (error: any) {
        console.error(
          `Error scraping Craigslist page ${pageNum}: ${error.message}`
        );
      }
    }

    return listings;
  }

  /**
   * Extract listings from current page
   * Phase 3: Updated for new Craigslist grid layout (li.cl-static-search-result)
   */
  private async extractListingsFromPage(page: Page): Promise<ScrapedListing[]> {
    const listings: ScrapedListing[] = [];

    // Phase 3: Updated selector for new layout
    // Old: li.cl-search-result (deprecated)
    // New: li.cl-static-search-result (current as of Dec 2025)
    const listingElements = await page.$$("li.cl-static-search-result");

    console.log(`[CRAIGSLIST] Found ${listingElements.length} listing elements`);

    for (const element of listingElements) {
      try {
        const listing = await this.extractListingData(page, element);
        if (listing) {
          listings.push(listing);
        }
      } catch (error: any) {
        console.error(`Error extracting CL listing: ${error.message}`);
      }
    }

    return listings;
  }

  /**
   * Extract data from a listing element
   * Phase 3: Updated for new Craigslist DOM structure
   */
  private async extractListingData(
    page: Page,
    element: any
  ): Promise<ScrapedListing | null> {
    try {
      // Phase 3: Updated - get any link with .html (new structure)
      // Old: a.cl-app-anchor
      // New: a[href*='.html'] (more flexible)
      const linkElement = await element.$("a[href*='.html']");
      if (!linkElement) return null;

      const href = await linkElement.getAttribute("href");
      if (!href) return null;

      const link = href.startsWith("http")
        ? href
        : `https://www.craigslist.org${href}`;

      // Phase 3: Get title from link text (new structure)
      const title = (await linkElement.textContent())?.trim() || "Untitled";

      // Skip if title is empty or just whitespace
      if (!title || title === "Untitled") {
        return null;
      }

      // Phase 3: Updated price selector
      // Old: span.priceinfo
      // New: .price (simplified class)
      const priceElement = await element.$(".price");
      const priceText = priceElement
        ? await priceElement.textContent()
        : "$0";
      const price = this.parsePrice(priceText || "$0");

      // Get location (structure unchanged)
      const locationElement = await element.$(".location, [class*='location']");
      const location = locationElement
        ? (await locationElement.textContent())?.trim()
        : undefined;

      // Get image (structure unchanged)
      const imgElement = await element.$("img");
      const imgSrc = imgElement ? await imgElement.getAttribute("src") : null;
      const images = imgSrc ? [imgSrc] : [];

      // Get timestamp (structure unchanged)
      const timeElement = await element.$("time");
      const timestamp = timeElement
        ? await timeElement.getAttribute("datetime")
        : null;

      // Extract seller/listing ID from URL
      const sellerId = this.extractListingIdFromUrl(link);

      return {
        title,
        price,
        currency: "USD",
        link,
        images,
        seller_id: sellerId,
        timestamp: timestamp || new Date().toISOString(),
        location,
        condition: "unknown",
        marketplace: "craigslist",
      };
    } catch (error: any) {
      console.error(`Error extracting CL listing data: ${error.message}`);
      return null;
    }
  }

  /**
   * Build Craigslist search URL
   */
  private buildSearchUrl(
    query: string,
    locationSubdomain: string,
    offset: number = 0
  ): string {
    const params = new URLSearchParams({
      query: query,
      sort: "date",
    });

    if (offset > 0) {
      params.set("s", offset.toString());
    }

    if (this.config.min_price) {
      params.set("min_price", this.config.min_price.toString());
    }

    if (this.config.max_price) {
      params.set("max_price", this.config.max_price.toString());
    }

    return `https://${locationSubdomain}.craigslist.org/search/sss?${params.toString()}`;
  }

  /**
   * Get Craigslist location subdomain
   */
  private getLocationSubdomain(location: string): string {
    const locationMap: Record<string, string> = {
      newyork: "newyork",
      "new york": "newyork",
      nyc: "newyork",
      "los angeles": "losangeles",
      la: "losangeles",
      chicago: "chicago",
      houston: "houston",
      phoenix: "phoenix",
      philadelphia: "philadelphia",
      "san antonio": "sanantonio",
      "san diego": "sandiego",
      dallas: "dallas",
      "san jose": "sanjose",
      austin: "austin",
      seattle: "seattle",
      miami: "miami",
      atlanta: "atlanta",
      boston: "boston",
      denver: "denver",
      portland: "portland",
      "san francisco": "sfbay",
      sf: "sfbay",
    };

    const normalized = location.toLowerCase().trim();
    return locationMap[normalized] || "newyork";
  }

  /**
   * Parse price from text
   */
  private parsePrice(priceText: string): number {
    const cleaned = priceText.replace(/[^0-9.]/g, "");
    return parseFloat(cleaned) || 0;
  }

  /**
   * Extract listing ID from Craigslist URL
   */
  private extractListingIdFromUrl(url: string): string {
    const match = url.match(/\/(\d+)\.html/);
    if (match) {
      return match[1];
    }

    // Fallback
    return Buffer.from(url).toString("base64").slice(0, 16);
  }
}
