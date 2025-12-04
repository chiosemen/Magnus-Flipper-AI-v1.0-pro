/**
 * Vinted Scraper
 * Real implementation with API endpoint scraping (Vinted uses GraphQL)
 */

import { Page } from "playwright";
import { BrowserManager } from "../utils/browserManager.js";
import axios from "axios";
import type {
  ScrapedListing,
  ScraperConfig,
  ScraperResult,
} from "../types/ScrapedListing.js";

export class VintedScraper {
  private browserManager: BrowserManager;
  private config: ScraperConfig;
  private readonly BASE_URL = "https://www.vinted.com";
  private readonly API_URL = "https://www.vinted.com/api/v2";
  private sessionCookie: string | null = null;

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
      marketplace: "vinted",
      success: false,
      listings: [],
      total_scraped: 0,
      errors: [],
      started_at: new Date().toISOString(),
      completed_at: "",
      duration_ms: 0,
    };

    try {
      // Get session cookie first
      await this.initializeSession();

      // Scrape each search query
      for (const query of this.config.search_queries) {
        try {
          const listings = await this.scrapeQuery(query);
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
      result.errors.push(`Vinted scraper error: ${error.message}`);
    } finally {
      await this.browserManager.close();

      result.completed_at = new Date().toISOString();
      result.duration_ms = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Initialize session by visiting the site and getting cookies
   */
  private async initializeSession(): Promise<void> {
    await this.browserManager.launch(this.config);
    const context = await this.browserManager.createContext(this.config);
    const page = await this.browserManager.createPage(context);

    try {
      await page.goto(this.BASE_URL, { waitUntil: "networkidle" });
      await this.browserManager.randomDelay(2000, 3000);

      // Accept cookies if present
      try {
        await page.click('button[id="onetrust-accept-btn-handler"]', {
          timeout: 3000,
        });
      } catch {
        // Cookie banner not present
      }

      // Get session cookie
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find((c) => c.name === "_vinted_fr_session");
      if (sessionCookie) {
        this.sessionCookie = sessionCookie.value;
      }
    } finally {
      await page.close();
    }
  }

  /**
   * Scrape listings for a specific query using API
   */
  private async scrapeQuery(query: string): Promise<ScrapedListing[]> {
    const listings: ScrapedListing[] = [];

    // Vinted uses pagination
    for (let page = 1; page <= this.config.max_pages; page++) {
      try {
        const apiListings = await this.fetchListingsFromAPI(query, page);

        if (apiListings.length === 0) {
          break;
        }

        listings.push(...apiListings);

        await this.browserManager.randomDelay(
          this.config.delay_min_ms,
          this.config.delay_max_ms
        );
      } catch (error: any) {
        console.error(`Error fetching Vinted page ${page}: ${error.message}`);
      }
    }

    return listings;
  }

  /**
   * Fetch listings from Vinted API
   */
  private async fetchListingsFromAPI(
    query: string,
    page: number
  ): Promise<ScrapedListing[]> {
    const params = new URLSearchParams({
      search_text: query,
      page: page.toString(),
      per_page: "96",
      order: "newest_first",
    });

    if (this.config.min_price) {
      params.set("price_from", this.config.min_price.toString());
    }

    if (this.config.max_price) {
      params.set("price_to", this.config.max_price.toString());
    }

    const headers: any = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
    };

    if (this.sessionCookie) {
      headers.Cookie = `_vinted_fr_session=${this.sessionCookie}`;
    }

    try {
      const response = await axios.get(
        `${this.API_URL}/catalog/items?${params.toString()}`,
        { headers }
      );

      const items = response.data?.items || [];
      return items.map((item: any) => this.transformAPIItem(item));
    } catch (error: any) {
      console.error(`Vinted API error: ${error.message}`);
      return [];
    }
  }

  /**
   * Transform Vinted API item to ScrapedListing
   */
  private transformAPIItem(item: any): ScrapedListing {
    const images = (item.photos || []).map((photo: any) => photo.url);

    return {
      title: item.title || "Untitled",
      price: parseFloat(item.price_numeric || item.price || 0),
      currency: item.currency || "USD",
      link: item.url || `${this.BASE_URL}/items/${item.id}`,
      images,
      seller_id: item.user?.id?.toString() || item.user_id?.toString() || "unknown",
      seller_name: item.user?.login || undefined,
      seller_rating: item.user?.feedback_reputation
        ? parseFloat(item.user.feedback_reputation)
        : undefined,
      seller_reviews_count: item.user?.feedback_count || undefined,
      timestamp: item.created_at_ts
        ? new Date(item.created_at_ts * 1000).toISOString()
        : new Date().toISOString(),
      location: item.user?.city || undefined,
      condition: this.parseCondition(item.status),
      category: item.catalog?.title || undefined,
      marketplace: "vinted",
      description: item.description || undefined,
      views_count: item.view_count || undefined,
      raw_data: item,
    };
  }

  /**
   * Parse condition from Vinted status
   */
  private parseCondition(
    status: string | null
  ): "new" | "like_new" | "good" | "fair" | "poor" | "unknown" {
    if (!status) return "unknown";

    const statusMap: Record<string, any> = {
      "1": "new",
      "2": "like_new",
      "3": "good",
      "4": "fair",
      "5": "poor",
    };

    return statusMap[status] || "unknown";
  }
}
