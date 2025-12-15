import { scrapeFacebookHTML, type HTMLScrapeResult, type ScrapedListing } from "./html";
import { scrapeFacebookPlaywright } from "./playwright";

export interface HybridScrapeInput {
  query: string;
  region: string;
  page?: number;
  batchSize?: number;
}

export interface HybridScrapeResult {
  source: "html" | "playwright";
  listings: ScrapedListing[];
}

const MIN_CONFIDENCE = 0.7;
const MIN_LISTINGS = 5;

export async function scrapeFacebookHybrid(
  input: HybridScrapeInput
): Promise<HybridScrapeResult> {
  const { query, region, page = 1 } = input;

  try {
    // Try HTML scraper first (fast, cheap)
    const htmlResult: HTMLScrapeResult = await scrapeFacebookHTML({
      query,
      region,
      page,
    });

    // Check if HTML result is sufficient
    if (
      !htmlResult.blocked &&
      htmlResult.confidence >= MIN_CONFIDENCE &&
      htmlResult.listings.length >= MIN_LISTINGS
    ) {
      return {
        source: "html",
        listings: htmlResult.listings,
      };
    }

    // HTML insufficient or blocked - escalate to Playwright
    console.log(
      `HTML scraper insufficient (confidence: ${htmlResult.confidence}, listings: ${htmlResult.listings.length}), escalating to Playwright`
    );

    const playwrightListings = await scrapeFacebookPlaywright({
      query,
      region,
      page,
    });

    return {
      source: "playwright",
      listings: playwrightListings,
    };
  } catch (error) {
    console.error("Hybrid scraper error, falling back to Playwright:", error);
    // On any error, fall back to Playwright
    const playwrightListings = await scrapeFacebookPlaywright({
      query,
      region,
      page,
    });

    return {
      source: "playwright",
      listings: playwrightListings,
    };
  }
}
