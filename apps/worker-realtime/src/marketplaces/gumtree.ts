import axios from "axios";
import * as cheerio from "cheerio";
import type { Listing } from "./craigslist";
import { getMarketplaceProfile } from '@magnus-flipper-ai/marketplace-config';
import { getFingerprintHeaders } from '../utils/fingerprintHelper';

export async function scrapeListings(query: string = "electronics"): Promise<Listing[]> {
  try {
    // Get fingerprint with rotation and mutation
    const profile = getMarketplaceProfile('gumtree');
    const headers = getFingerprintHeaders('gumtree', profile);

    const response = await axios.get(
      `https://www.gumtree.com/search?search_category=all&q=${encodeURIComponent(query)}`,
      {
        headers,
        timeout: 10000,
      }
    );

    const $ = cheerio.load(response.data);
    const listings: Listing[] = [];

  $(".listing-link").each((_: unknown, element: any) => {
      const $el = $(element);
      const title = $el.find(".listing-title").text().trim();
      const priceText = $el.find(".listing-price").text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;
      const url = "https://www.gumtree.com" + ($el.attr("href") || "");
      const imageUrl = $el.find("img").attr("src");

      if (title && url) {
        listings.push({
          marketplace: "gumtree",
          title,
          price,
          url,
          image_url: imageUrl,
          posted_at: new Date(),
          metadata: { query },
        });
      }
    });

    return listings.slice(0, 20);
  } catch (error) {
    console.error("Gumtree scrape error:", error);
    return [];
  }
}
