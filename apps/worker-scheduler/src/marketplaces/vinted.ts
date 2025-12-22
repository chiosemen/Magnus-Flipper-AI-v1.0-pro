import axios from "axios";
import type { Listing } from "./craigslist.js";

export async function scrapeListings(query: string = "clothing"): Promise<Listing[]> {
  try {
    const response = await axios.get(
      `https://www.vinted.com/api/v2/catalog/items`,
      {
        params: {
          search_text: query,
          per_page: 20,
        },
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MagnusFlipper/1.0)",
        },
        timeout: 10000,
      }
    );

    const listings: Listing[] = response.data.items?.map((item: any) => ({
      marketplace: "vinted",
      title: item.title,
      price: parseFloat(item.price) || 0,
      url: item.url,
      image_url: item.photo?.url,
      posted_at: new Date(item.created_at),
      metadata: {
        brand: item.brand_title,
        size: item.size_title,
        user: item.user?.login,
      },
    })) || [];

    return listings.slice(0, 20);
  } catch (error) {
    console.error("Vinted scrape error:", error);
    return [];
  }
}
