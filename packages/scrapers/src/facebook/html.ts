import * as cheerio from "cheerio";

export interface HTMLScrapeResult {
  listings: ScrapedListing[];
  blocked: boolean;
  confidence: number;
}

export interface ScrapedListing {
  id: string;
  title: string;
  price?: number;
  imageUrl?: string;
  url: string;
  marketplace: "facebook";
  region: string;
  scrapedAt: string;
}

export interface HTMLScrapeInput {
  query: string;
  region: string;
  page?: number;
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

    const $ = cheerio.load(html);
    const listings: ScrapedListing[] = [];

    // Try to find marketplace listing elements
    // Facebook Marketplace structure may vary, so we try multiple selectors
    $("a[href*='/marketplace/item/']").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      const itemId = href.split("/").pop() || `item-${Date.now()}-${Math.random()}`;
      const title = $(el).text().trim().slice(0, 120) || "Unknown item";

      listings.push({
        id: itemId,
        title,
        url: href.startsWith("http") ? href : `https://facebook.com${href}`,
        marketplace: "facebook",
        region,
        scrapedAt: new Date().toISOString(),
      });
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
