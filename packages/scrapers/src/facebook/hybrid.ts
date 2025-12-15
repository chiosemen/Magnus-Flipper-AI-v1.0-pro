import { parseSearchHtml } from "./html";
import { hydrateFromOpenGraph } from "./hydrate-og";
import { hydrateListingViaPlaywright } from "./playwright";
import { FB_ALWAYS_HYDRATE_TOP_N } from "./constants";
import { hashImageUrl } from "../utils/imageHash";
import type { ScrapedListing } from "../types";

export interface HybridScrapeInput {
  query: string;
  region: string;
  page?: number;
  batchSize?: number;
  limit?: number;
}

export interface HybridScrapeResult {
  source: "html" | "playwright";
  listings: ScrapedListing[];
}

export async function scrapeFacebookHybrid(
  params: HybridScrapeInput
): Promise<HybridScrapeResult> {
  const { query, region, limit = 20 } = params;
  const baseUrl = "https://www.facebook.com";
  const searchUrl = `${baseUrl}/marketplace/${encodeURIComponent(region)}/search/?query=${encodeURIComponent(query)}`;

  try {
    const htmlRes = await fetch(searchUrl, {
      headers: { Accept: "text/html" },
    });

    if (!htmlRes.ok) {
      // Fallback to Playwright if HTML fetch fails
      const { scrapeFacebookPlaywright } = await import("./playwright");
      const playwrightListings = await scrapeFacebookPlaywright({
        query,
        region,
        page: params.page,
      });
      return {
        source: "playwright",
        listings: playwrightListings,
      };
    }

    const html = await htmlRes.text();
    const rough = parseSearchHtml(html, baseUrl).slice(0, limit);

    const now = new Date().toISOString();

    // Convert rough listings to ScrapedListing format with normalized IDs and image hashes
    const htmlListings: ScrapedListing[] = rough.map((x) => {
      let priceValue: number | undefined;
      let currency: string | undefined;

      // Try to parse priceText to priceValue and currency
      if (x.priceText) {
        const priceMatch = x.priceText.match(/(?:£|\$|€)\s?(\d[\d,]*(?:\.\d{2})?)/);
        if (priceMatch) {
          priceValue = Number(priceMatch[1].replace(/,/g, ""));
          currency = x.priceText.includes("£") ? "GBP" : x.priceText.includes("$") ? "USD" : "EUR";
        }
      }

      // Extract listingId from URL (normalize ID)
      const listingIdMatch = x.url.match(/\/item\/(\d+)/);
      const listingId = listingIdMatch?.[1] || x.id;

      // Calculate image hash if imageUrl exists
      const imageHash = x.imageUrl ? hashImageUrl(x.imageUrl) : undefined;

      return {
        listingId,
        id: listingId, // Keep for backward compatibility
        title: x.title,
        url: x.url,
        imageUrl: x.imageUrl,
        imageHash,
        priceText: x.priceText,
        priceValue,
        currency,
        scrapedAt: now,
        source: "facebook",
        confidence: (x.imageUrl ? 0.5 : 0.2) + (x.priceText ? 0.4 : 0.1),
        raw: { searchUrl },
      };
    });

    if (htmlListings.length === 0) {
      return {
        source: "html",
        listings: [],
      };
    }

    // Always hydrate top N via Playwright (premium UI)
    const toHydrate = htmlListings.slice(0, FB_ALWAYS_HYDRATE_TOP_N);
    const rest = htmlListings.slice(FB_ALWAYS_HYDRATE_TOP_N);

    const hydrated: ScrapedListing[] = [];

    for (const listing of toHydrate) {
      try {
        // First try OG hydration (fast, cheap)
        if (!listing.imageUrl || !listing.priceText) {
          const og = await hydrateFromOpenGraph(listing.url);
          if (og.ogImage) {
            listing.imageUrl = listing.imageUrl || og.ogImage;
            // Update image hash if we got a new image
            if (og.ogImage && !listing.imageHash) {
              listing.imageHash = hashImageUrl(og.ogImage);
            }
          }
          if (og.ogTitle) listing.title = og.ogTitle || listing.title;
          if (!listing.priceText && og.ogPriceAmount != null) {
            listing.priceValue = og.ogPriceAmount;
            listing.currency = og.ogCurrency;
            listing.priceText = listing.currency
              ? `${listing.currency} ${listing.priceValue}`
              : String(listing.priceValue);
          }
        }

        // Then Playwright hydration for authoritative data (includes image hash)
        const full = await hydrateListingViaPlaywright(listing);
        hydrated.push(full);
      } catch (err) {
        console.error("Hydration error for listing:", listing.url, err);
        // Fallback: keep HTML version if hydration fails, but ensure imageHash exists
        if (listing.imageUrl && !listing.imageHash) {
          listing.imageHash = hashImageUrl(listing.imageUrl);
        }
        hydrated.push(listing);
      }
    }

    // Ensure rest listings have image hashes
    const restWithHashes = rest.map((listing) => {
      if (listing.imageUrl && !listing.imageHash) {
        return {
          ...listing,
          imageHash: hashImageUrl(listing.imageUrl),
        };
      }
      return listing;
    });

    // Combine hydrated top N with rest
    return {
      source: "html",
      listings: [...hydrated, ...restWithHashes],
    };
  } catch (error) {
    console.error("Hybrid scraper error, falling back to Playwright:", error);
    // On any error, fall back to Playwright
    const { scrapeFacebookPlaywright } = await import("./playwright");
    const playwrightListings = await scrapeFacebookPlaywright({
      query,
      region,
      page: params.page,
    });

    return {
      source: "playwright",
      listings: playwrightListings,
    };
  }
}
