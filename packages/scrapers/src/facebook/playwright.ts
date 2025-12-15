import { chromium, type Browser, type Page } from "playwright";
import type { ScrapedListing } from "../types";
import { rotateUA } from "./utils";
import { hashImageUrl } from "../utils/imageHash";

export interface PlaywrightScrapeInput {
  query: string;
  region: string;
  page?: number;
}

// Hydrate a single listing via Playwright (for top N enrichment)
export async function hydrateListingViaPlaywright(listing: ScrapedListing): Promise<ScrapedListing> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
    });

    // Rotate user agent deterministically based on listing URL
    const userAgent = rotateUA(listing.url);
    const context = await browser.newContext({
      userAgent,
      viewport: { width: 1280, height: 800 },
    });

    const page: Page = await context.newPage();

    // Stealth hardening
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    await page.emulateMedia({ reducedMotion: "no-preference" });

    await page.goto(listing.url, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    // Extract price and image from listing page
    const enriched = await page.evaluate(() => {
      // Price: try common text patterns
      const body = document.body?.innerText || "";
      const priceMatch =
        body.match(/(?:£|\$|€)\s?\d[\d,]*(?:\.\d{2})?/) ||
        body.match(/\d[\d,]*(?:\.\d{2})?\s?(?:USD|GBP|EUR)/i);
      const priceText = priceMatch?.[0] ?? null;

      // Image: prioritize scontent CDN URLs (Facebook's image CDN)
      const scontentImg = document.querySelector('img[src*="scontent"]') as HTMLImageElement | null;
      const ogImage = document.querySelector("meta[property='og:image']") as HTMLMetaElement | null;
      const fallbackImg = document.querySelector("img[src]") as HTMLImageElement | null;
      
      const imageUrl = 
        scontentImg?.getAttribute("src") ?? 
        ogImage?.content ?? 
        fallbackImg?.src ?? 
        null;

      return { priceText, imageUrl };
    });

    await browser.close();

    // Calculate image hash if imageUrl exists
    const finalImageUrl = listing.imageUrl || enriched.imageUrl || undefined;
    const imageHash = finalImageUrl ? hashImageUrl(finalImageUrl) : undefined;

    return {
      ...listing,
      priceText: listing.priceText || enriched.priceText || undefined,
      imageUrl: finalImageUrl,
      imageHash: imageHash || (listing.imageUrl ? hashImageUrl(listing.imageUrl) : undefined),
    };
  } catch (error) {
    console.error("Playwright hydration error:", error);
    if (browser) {
      await browser.close().catch(() => {});
    }
    // Return original listing if hydration fails
    return listing;
  }
}

export async function scrapeFacebookPlaywright(
  input: PlaywrightScrapeInput
): Promise<ScrapedListing[]> {
  const { query, region } = input;
  let browser: Browser | null = null;

  try {
    // Stealth hardening: remove webdriver property
    const launchOptions: Parameters<typeof chromium.launch>[0] = {
      headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
    };

    // Optional proxy support (for legitimate egress control)
    if (process.env.OUTBOUND_PROXY_URL) {
      launchOptions.proxy = {
        server: process.env.OUTBOUND_PROXY_URL,
      };
    }

    browser = await chromium.launch(launchOptions);

    // Rotate user agent deterministically based on query
    const userAgent = rotateUA(query);
    const context = await browser.newContext({
      userAgent,
      viewport: { width: 1280, height: 800 },
    });

    const page: Page = await context.newPage();

    // Stealth hardening
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    await page.emulateMedia({ reducedMotion: "no-preference" });

    await page.setExtraHTTPHeaders({
      "Accept-Language": region === "UK" ? "en-GB,en;q=0.9" : "en-US,en;q=0.9",
    });

    const url = `https://www.facebook.com/marketplace/${region.toLowerCase()}/search?query=${encodeURIComponent(query)}`;

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Try to find search input and fill it if needed
    try {
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible({ timeout: 2000 })) {
        await searchInput.fill(query);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(2000);
      }
    } catch {
      // Search input not found, continue with current page
    }

    // Extract listings
    const rawListings = await page.$$eval(
      'a[href*="/marketplace/item/"]',
      (nodes, region) => {
        return nodes.slice(0, 20).map((node) => {
          const href = node.getAttribute("href") || "";
          const itemId = href.split("/").pop() || `item-${Date.now()}-${Math.random()}`;
          const title = node.textContent?.trim().slice(0, 120) || "Unknown item";

          return {
            id: itemId,
            title,
            url: href.startsWith("http") ? href : `https://facebook.com${href}`,
            marketplace: "facebook" as const,
            region,
            scrapedAt: new Date().toISOString(),
          };
        });
      },
      region
    );

    await browser.close();
    
    // Convert to ScrapedListing format with normalized IDs and image hashes
    const listings: ScrapedListing[] = rawListings.map((item) => {
      // Extract listingId from URL or use fallback
      const listingIdMatch = item.url.match(/\/item\/(\d+)/);
      const listingId = listingIdMatch?.[1] || item.id;
      
      // Calculate image hash if we can extract image later (not available in search results)
      // Image hash will be added during hydration if needed
      
      return {
        listingId,
        id: listingId, // Keep for backward compatibility
        title: item.title,
        url: item.url,
        scrapedAt: item.scrapedAt,
        source: "facebook" as const,
        confidence: 0.5, // Default confidence for Playwright scrapes
      };
    });

    return listings;
  } catch (error) {
    console.error("Facebook Playwright scrape error:", error);
    if (browser) {
      await browser.close();
    }
    return [];
  }
}
