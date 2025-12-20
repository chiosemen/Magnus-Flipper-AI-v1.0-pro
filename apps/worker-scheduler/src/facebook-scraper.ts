import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Facebook Marketplace Scraper
 * 
 * Fetches listings from Facebook Marketplace search results
 * Note: This is a simplified scraper that works with public search URLs
 */
export interface FacebookListing {
  title: string;
  price: number;
  location: string;
  condition?: string;
  url: string;
  imageUrl?: string;
  description?: string;
  externalId: string;
}

/**
 * Scrape Facebook Marketplace for a given search query
 */
export async function scrapeFacebookListings(
  keywords: string[],
  options: {
    minPrice?: number;
    maxPrice?: number;
    maxDistanceMiles?: number;
    condition?: string[];
  } = {}
): Promise<FacebookListing[]> {
  const query = keywords.join(" ");
  
  // Build Facebook Marketplace search URL
  // Format: https://www.facebook.com/marketplace/search/?query=...
  const params = new URLSearchParams();
  params.set("query", query);
  
  if (options.minPrice) {
    params.set("minPrice", options.minPrice.toString());
  }
  if (options.maxPrice) {
    params.set("maxPrice", options.maxPrice.toString());
  }
  if (options.maxDistanceMiles) {
    params.set("radius", options.maxDistanceMiles.toString());
  }

  const searchUrl = `https://www.facebook.com/marketplace/search/?${params.toString()}`;

  try {
    // Fetch the search page
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      timeout: 30000,
      maxRedirects: 5,
    });

    if (response.status !== 200) {
      console.warn(`Facebook search returned status ${response.status}`);
      return [];
    }

    // Parse HTML
    const $ = cheerio.load(response.data);
    const listings: FacebookListing[] = [];

    // Facebook Marketplace listings are in specific div structures
    // Look for listing cards - this selector may need adjustment based on FB's current structure
    $('div[role="article"]').each((index, element) => {
      try {
        const $el = $(element);
        
        // Extract title
        const titleEl = $el.find('span[dir="auto"]').first();
        const title = titleEl.text().trim();
        
        if (!title) return;

        // Extract price
        const priceText = $el.find('span:contains("$")').first().text();
        const priceMatch = priceText.match(/\$?([\d,]+)/);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : 0;

        // Extract location
        const locationEl = $el.find('span:not([dir="auto"])').filter((i, el) => {
          const text = $(el).text();
          return text.includes(",") || /\d+\s*(mi|km)/i.test(text);
        }).first();
        const location = locationEl.text().trim() || "Unknown";

        // Extract URL
        const linkEl = $el.find('a[href*="/marketplace/item/"]').first();
        const href = linkEl.attr("href");
        const url = href
          ? href.startsWith("http")
            ? href
            : `https://www.facebook.com${href}`
          : "";

        if (!url) return;

        // Extract external ID from URL
        const idMatch = url.match(/\/item\/(\d+)/);
        const externalId = idMatch ? `fb_${idMatch[1]}` : `fb_${Date.now()}_${index}`;

        // Extract image
        const imgEl = $el.find("img").first();
        const imageUrl = imgEl.attr("src") || undefined;

        // Extract condition if available
        const conditionText = $el.text();
        let condition: string | undefined;
        if (conditionText.match(/new|brand new/i)) {
          condition = "new";
        } else if (conditionText.match(/like new|excellent/i)) {
          condition = "like_new";
        } else if (conditionText.match(/good/i)) {
          condition = "good";
        } else if (conditionText.match(/fair|acceptable/i)) {
          condition = "fair";
        }

        listings.push({
          title,
          price,
          location,
          condition,
          url,
          imageUrl,
          externalId,
        });
      } catch (error: any) {
        console.error(`Error parsing listing ${index}:`, error.message);
        // Continue with next listing
      }
    });

    // If no listings found with the main selector, try alternative approach
    if (listings.length === 0) {
      // Try to find listings in JSON-LD or other structured data
      const jsonScripts = $('script[type="application/ld+json"]');
      jsonScripts.each((index, element) => {
        try {
          const jsonText = $(element).html();
          if (jsonText) {
            const data = JSON.parse(jsonText);
            // Parse structured data if available
            // This is a fallback - Facebook's structure may vary
          }
        } catch {
          // Ignore JSON parse errors
        }
      });
    }

    console.log(`Scraped ${listings.length} listings from Facebook for query: ${query}`);
    return listings;
  } catch (error: any) {
    console.error("Error scraping Facebook Marketplace:", error.message);
    // Return empty array on error - don't crash the worker
    return [];
  }
}
