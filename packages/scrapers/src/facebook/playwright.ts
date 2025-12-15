import { chromium, type Browser, type Page } from "playwright";
import type { ScrapedListing } from "./html";

export interface PlaywrightScrapeInput {
  query: string;
  region: string;
  page?: number;
}

export async function scrapeFacebookPlaywright(
  input: PlaywrightScrapeInput
): Promise<ScrapedListing[]> {
  const { query, region } = input;
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
    });

    const page: Page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewportSize({ width: 1920, height: 1080 });
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
    const listings = await page.$$eval(
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
    return listings;
  } catch (error) {
    console.error("Facebook Playwright scrape error:", error);
    if (browser) {
      await browser.close();
    }
    return [];
  }
}
