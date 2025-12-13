import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Vinted Marketplace Scraper
 * 
 * Fetches listings from Vinted search results
 * Pattern-matched to Facebook scraper structure
 */
export interface VintedListing {
  title: string;
  price: number;
  location: string;
  condition?: string;
  url: string;
  imageUrl?: string;
  description?: string;
  externalId: string;
  brand?: string;
  size?: string;
}

/**
 * Scrape Vinted for a given search query
 */
export async function scrapeVintedListings(
  keywords: string[],
  options: {
    minPrice?: number;
    maxPrice?: number;
    maxDistanceMiles?: number;
    condition?: string[];
  } = {}
): Promise<VintedListing[]> {
  const query = keywords.join(" ");
  
  // Build Vinted search URL
  // Format: https://www.vinted.com/catalog?search_text=...
  const params = new URLSearchParams();
  params.set("search_text", query);
  
  if (options.minPrice) {
    params.set("price_from", options.minPrice.toString());
  }
  if (options.maxPrice) {
    params.set("price_to", options.maxPrice.toString());
  }

  const searchUrl = `https://www.vinted.com/catalog?${params.toString()}`;

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
      console.warn(`Vinted search returned status ${response.status}`);
      return [];
    }

    // Parse HTML
    const $ = cheerio.load(response.data);
    const listings: VintedListing[] = [];

    // Vinted listings are typically in article or div elements with specific classes
    // Look for item cards - this selector may need adjustment based on Vinted's current structure
    $('article, div[class*="item"], div[class*="product"]').each((index, element) => {
      try {
        const $el = $(element);
        
        // Extract title
        const titleEl = $el.find('h2, h3, [class*="title"], [class*="name"]').first();
        const title = titleEl.text().trim();
        
        if (!title) return;

        // Extract price
        const priceText = $el.find('[class*="price"], [class*="amount"]').first().text();
        const priceMatch = priceText.match(/(?:£|€|\$|USD|EUR|GBP)?\s*([\d,]+(?:\.\d{2})?)/);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : 0;

        // Extract location
        const locationEl = $el.find('[class*="location"], [class*="city"]').first();
        const location = locationEl.text().trim() || "Unknown";

        // Extract URL
        const linkEl = $el.find('a[href*="/items/"], a[href*="/catalog/"]').first();
        const href = linkEl.attr("href");
        const url = href
          ? href.startsWith("http")
            ? href
            : `https://www.vinted.com${href}`
          : "";

        if (!url) return;

        // Extract external ID from URL
        const idMatch = url.match(/\/items\/(\d+)/) || url.match(/\/catalog\/items\/(\d+)/);
        const externalId = idMatch ? `vinted_${idMatch[1]}` : `vinted_${Date.now()}_${index}`;

        // Extract image
        const imgEl = $el.find("img").first();
        const imageUrl = imgEl.attr("src") || imgEl.attr("data-src") || undefined;

        // Extract brand if available
        const brandEl = $el.find('[class*="brand"]').first();
        const brand = brandEl.text().trim() || undefined;

        // Extract size if available
        const sizeEl = $el.find('[class*="size"]').first();
        const size = sizeEl.text().trim() || undefined;

        // Extract condition if available
        const conditionText = $el.text();
        let condition: string | undefined;
        if (conditionText.match(/new|brand new|never worn/i)) {
          condition = "new";
        } else if (conditionText.match(/very good|excellent/i)) {
          condition = "like_new";
        } else if (conditionText.match(/good/i)) {
          condition = "good";
        } else if (conditionText.match(/satisfactory|fair/i)) {
          condition = "fair";
        }

        listings.push({
          title,
          price,
          location,
          condition,
          url,
          imageUrl,
          brand,
          size,
          externalId,
        });
      } catch (error: any) {
        console.error(`Error parsing listing ${index}:`, error.message);
        // Continue with next listing
      }
    });

    // If no listings found with main selector, try alternative approach
    if (listings.length === 0) {
      // Try Vinted API if available
      try {
        const apiUrl = `https://www.vinted.com/api/v2/catalog/items?search_text=${encodeURIComponent(query)}`;
        const apiResponse = await axios.get(apiUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            Accept: "application/json",
          },
          timeout: 10000,
        });

        if (apiResponse.data && apiResponse.data.items) {
          const items = apiResponse.data.items;
          for (const item of items.slice(0, 20)) {
            listings.push({
              title: item.title || "Vinted Item",
              price: parseFloat(item.price) || 0,
              location: item.user?.city || item.location?.city || "Unknown",
              condition: item.status === "active" ? "new" : undefined,
              url: item.url || `https://www.vinted.com/items/${item.id}`,
              imageUrl: item.photos?.[0]?.url || item.photo?.url,
              brand: item.brand_title,
              size: item.size_title,
              externalId: `vinted_${item.id}`,
            });
          }
        }
      } catch (apiError: any) {
        console.log(`Vinted API fallback failed: ${apiError.message}`);
      }
    }

    console.log(`Scraped ${listings.length} listings from Vinted for query: ${query}`);
    return listings;
  } catch (error: any) {
    console.error("Error scraping Vinted:", error.message);
    // Return empty array on error - don't crash the worker
    return [];
  }
}
