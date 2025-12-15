import * as cheerio from "cheerio";
import type { ScrapedListing } from "../types";
import { hashImageUrl } from "../utils/imageHash";

export interface HTMLScrapeResult {
  listings: ScrapedListing[];
  blocked: boolean;
  confidence: number;
}

export interface HTMLScrapeInput {
  query: string;
  region: string;
  page?: number;
}

// Helper: Extract price text from string using regex
const moneyRx = /(?:£|\$|€)\s?\d[\d,]*(?:\.\d{2})?/;

export function extractPriceText(text: string): string | undefined {
  const m = text.match(moneyRx);
  return m?.[0]?.trim();
}

// Helper: Pick best image URL from srcset or fallback to src
export function pickBestImageUrl(srcset?: string, src?: string): string | undefined {
  if (!srcset && src) return src;
  if (!srcset) return undefined;
  // srcset: "url 320w, url 640w"
  const parts = srcset.split(",").map((s) => s.trim().split(" "));
  const best = parts
    .map(([u, w]) => ({ u, w: Number((w || "").replace("w", "")) || 0 }))
    .sort((a, b) => b.w - a.w)[0];
  return best?.u || src;
}

// Helper: Parse search HTML and extract rough listing objects
export function parseSearchHtml(html: string, baseUrl: string): Array<{
  id: string;
  title: string;
  url: string;
  priceText?: string;
  imageUrl?: string;
}> {
  const $ = cheerio.load(html);
  const cards: Array<{
    id: string;
    title: string;
    url: string;
    priceText?: string;
    imageUrl?: string;
  }> = [];

  $("a").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;

    // Marketplace item URL heuristic
    if (!href.includes("/marketplace/item/")) return;

    const url = href.startsWith("http") ? href : new URL(href, baseUrl).toString();
    const container = $(a).closest("div");

    const title = container.text().split("\n").map((s) => s.trim()).filter(Boolean)[0] || "Listing";
    const priceText = extractPriceText(container.text());

    const img = container.find("img").first();
    const imageUrl = pickBestImageUrl(img.attr("srcset"), img.attr("src"));

    // Try pull ID from URL
    const idMatch = url.match(/\/marketplace\/item\/(\d+)/);
    const id = idMatch?.[1] || url;

    cards.push({ id, title, url, priceText, imageUrl });
  });

  return cards;
}

export async function scrapeFacebookHTML(
  input: HTMLScrapeInput
): Promise<HTMLScrapeResult> {
  const { query, region, page = 1 } = input;

  try {
    const url = `https://www.facebook.com/marketplace/${region.toLowerCase()}/search?query=${encodeURIComponent(query)}&page=${page}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept-Language": region === "UK" ? "en-GB,en;q=0.9" : "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return { listings: [], blocked: true, confidence: 0 };
    }

    const html = await response.text();

    // Detect login wall or CAPTCHA
    if (
      html.includes("Log in to Facebook") ||
      html.includes("login") ||
      html.includes("captcha") ||
      html.includes("security check")
    ) {
      return { listings: [], blocked: true, confidence: 0 };
    }

    const baseUrl = "https://www.facebook.com";
    const rough = parseSearchHtml(html, baseUrl);
    const now = new Date().toISOString();

    const listings: ScrapedListing[] = rough.slice(0, 20).map((card) => {
      // Extract listingId from URL (normalize ID)
      const listingIdMatch = card.url.match(/\/item\/(\d+)/);
      const listingId = listingIdMatch?.[1] || card.id;

      // Calculate image hash if imageUrl exists
      const imageHash = card.imageUrl ? hashImageUrl(card.imageUrl) : undefined;

      return {
        listingId,
        id: listingId, // Keep for backward compatibility
        title: card.title,
        url: card.url,
        priceText: card.priceText,
        imageUrl: card.imageUrl,
        imageHash,
        scrapedAt: now,
        source: "facebook",
        confidence: (card.imageUrl ? 0.5 : 0.2) + (card.priceText ? 0.4 : 0.1),
      };
    });

    // Calculate confidence based on results
    const confidence = listings.length >= 5 ? 0.8 : listings.length > 0 ? 0.5 : 0;

    return {
      listings: listings.slice(0, 20), // Limit to 20 per page
      blocked: listings.length === 0,
      confidence,
    };
  } catch (error) {
    console.error("Facebook HTML scrape error:", error);
    return { listings: [], blocked: true, confidence: 0 };
  }
}
