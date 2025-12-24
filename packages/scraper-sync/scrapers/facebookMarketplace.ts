/**
 * Facebook Marketplace Scraper
 * Real implementation with login flow, dynamic scrolling, and pagination
 */

import { Page } from "playwright";
import { BrowserManager } from "../utils/browserManager.js";
import type {
  ScrapedListing,
  ScraperConfig,
  ScraperResult,
} from "../types/ScrapedListing.js";

export class FacebookMarketplaceScraper {
  private browserManager: BrowserManager;
  private config: ScraperConfig;

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
      marketplace: "facebook",
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
      // Launch browser and create context
      await this.browserManager.launch(this.config, this.config.marketplace);
      const context = await this.browserManager.createContext(this.config, this.config.marketplace);
      page = await this.browserManager.createPage(context);

      // Login if credentials provided
      if (
        this.config.auth_credentials?.email &&
        this.config.auth_credentials?.password
      ) {
        await this.login(page);
      }

      // Scrape each search query
      for (const query of this.config.search_queries) {
        try {
          const listings = await this.scrapeQuery(page, query);
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
      const errorMsg = `Facebook scraper error: ${error.message}`;
      console.error("[SCRAPER]", errorMsg, error);
      result.errors.push(errorMsg);
      // Rethrow to ensure errors are visible
      throw error;
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
   * Login to Facebook
   */
  private async login(page: Page): Promise<void> {
    try {
      await page.goto("https://www.facebook.com/", {
        waitUntil: "networkidle",
      });

      // Accept cookies if present
      try {
        await page
          .click('button[data-cookiebanner="accept_button"]', {
            timeout: 3000,
          });
      } catch {
        // Cookie banner not present
      }

      await this.browserManager.randomDelay(1000, 2000);

      // Enter email
      await page.fill('input[name="email"]', this.config.auth_credentials!.email);
      await this.browserManager.randomDelay(500, 1000);

      // Enter password
      await page.fill(
        'input[name="pass"]',
        this.config.auth_credentials!.password
      );
      await this.browserManager.randomDelay(500, 1000);

      // Click login
      await page.click('button[name="login"]');
      await page.waitForLoadState("networkidle");

      // Wait for redirect to feed
      await page.waitForURL(/facebook\.com/, { timeout: 10000 });

      await this.browserManager.randomDelay(2000, 3000);
    } catch (error: any) {
      throw new Error(`Facebook login failed: ${error.message}`);
    }
  }

  /**
   * Scrape listings for a specific query
   */
  private async scrapeQuery(page: Page, query: string): Promise<ScrapedListing[]> {
    const listings: ScrapedListing[] = [];

    // Navigate to Marketplace search
    const searchUrl = this.buildSearchUrl(query);
    console.log("[SCRAPER] Navigating to Facebook Marketplace");
    await page.goto(searchUrl, { waitUntil: "networkidle" });

    await this.browserManager.randomDelay(2000, 3000);

    // Scroll to load more items (Facebook uses infinite scroll)
    await this.infiniteScrollLoadItems(page);

    // Extract all listing cards
    const listingElements = await page.$$('div[class*="x9f619"]'); // FB Marketplace card selector

    for (const element of listingElements.slice(0, this.config.max_pages * 20)) {
      try {
        const listing = await this.extractListingData(page, element);
        if (listing) {
          listings.push(listing);
        }
      } catch (error: any) {
        console.error(`Error extracting FB listing: ${error.message}`);
      }

      await this.browserManager.randomDelay(
        this.config.delay_min_ms,
        this.config.delay_max_ms
      );
    }

    return listings;
  }

  /**
   * Build Facebook Marketplace search URL
   */
  private buildSearchUrl(query: string): string {
    const params = new URLSearchParams({
      query: query,
      sortBy: "creation_time_descend",
      exact: "false",
    });

    if (this.config.location) {
      params.set("location", this.config.location);
      params.set("radius", "50"); // 50 miles radius
    }

    if (this.config.min_price) {
      params.set("minPrice", this.config.min_price.toString());
    }

    if (this.config.max_price) {
      params.set("maxPrice", this.config.max_price.toString());
    }

    return `https://www.facebook.com/marketplace/search/?${params.toString()}`;
  }

  /**
   * Infinite scroll to load items
   */
  private async infiniteScrollLoadItems(page: Page): Promise<void> {
    let previousCount = 0;
    let scrollAttempts = 0;
    const maxScrolls = this.config.max_pages * 3;

    while (scrollAttempts < maxScrolls) {
      // Get current item count
      const currentCount = await page.$$eval(
        'div[class*="x9f619"]',
        (elements) => elements.length
      );

      if (currentCount === previousCount) {
        // No new items loaded, try one more time
        scrollAttempts++;
        if (scrollAttempts >= 3) break;
      } else {
        scrollAttempts = 0;
      }

      previousCount = currentCount;

      // Scroll down
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await this.browserManager.randomDelay(2000, 3000);
    }
  }

  /**
   * Extract data from a listing element
   * Phase 3: Added noise filtering for UI elements
   */
  private async extractListingData(
    page: Page,
    element: any
  ): Promise<ScrapedListing | null> {
    try {
      // Get listing link
      const linkElement = await element.$("a");
      if (!linkElement) return null;

      const relativeLink = await linkElement.getAttribute("href");
      if (!relativeLink) return null;

      const link = relativeLink.startsWith("http")
        ? relativeLink
        : `https://www.facebook.com${relativeLink.split("?")[0]}`;

      // Get title
      const titleElement = await element.$('span[class*="x1lliihq"]');
      const title = titleElement
        ? await titleElement.textContent()
        : "Untitled";

      // Get price
      const priceElement = await element.$('span[class*="x193iq5w"]');
      const priceText = priceElement
        ? await priceElement.textContent()
        : "$0";
      const price = this.parsePrice(priceText || "$0");

      // Phase 3: Filter out UI noise (more conservative approach)
      // Only filter if ALL these conditions match (likely UI element):
      // 1. Price is $0
      // 2. NOT explicitly marked as "free"
      // 3. Title suggests UI element ("Find", "See more", etc.)
      const isUIElement =
        price === 0 &&
        !priceText.toLowerCase().includes("free") &&
        (title?.toLowerCase().includes("find") ||
          title?.toLowerCase().includes("see more") ||
          title?.toLowerCase().includes("suggested") ||
          link === "https://www.facebook.com");

      if (isUIElement) {
        console.log(`[FACEBOOK] Filtered UI noise: "${title}" @ $${price}`);
        return null;
      }

      // Get location
      const locationElement = await element.$('span[class*="x1lliihq"]:nth-child(2)');
      const location = locationElement
        ? await locationElement.textContent()
        : undefined;

      // Get image
      const imgElement = await element.$("img");
      const imgSrc = imgElement ? await imgElement.getAttribute("src") : null;
      const images = imgSrc ? [imgSrc] : [];

      // Extract seller ID from link
      const sellerId = this.extractSellerIdFromUrl(link);

      return {
        title: title || "Untitled",
        price,
        currency: "USD",
        link,
        images,
        seller_id: sellerId,
        timestamp: new Date().toISOString(),
        location,
        condition: "unknown",
        marketplace: "facebook",
      };
    } catch (error: any) {
      console.error(`Error extracting FB listing data: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse price from text
   */
  private parsePrice(priceText: string): number {
    const cleaned = priceText.replace(/[^0-9.]/g, "");
    return parseFloat(cleaned) || 0;
  }

  /**
   * Extract seller ID from Facebook URL
   */
  private extractSellerIdFromUrl(url: string): string {
    const match = url.match(/\/marketplace\/item\/(\d+)/);
    if (match) {
      return match[1];
    }

    // Fallback: use URL hash
    return Buffer.from(url).toString("base64").slice(0, 16);
  }
}
