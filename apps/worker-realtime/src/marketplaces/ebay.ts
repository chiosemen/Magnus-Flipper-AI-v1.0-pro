import axios from "axios";
import type { Listing } from "./craigslist";

export async function scrapeListings(query: string = "electronics"): Promise<Listing[]> {
  try {
    const apiKey = process.env.EBAY_API_KEY;

    if (!apiKey) {
      console.warn("eBay API key not configured, using mock data");
      return generateMockListings(query);
    }

    const response = await axios.get(
      `https://api.ebay.com/buy/browse/v1/item_summary/search`,
      {
        params: { q: query, limit: 20 },
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
      }
    );

    const listings: Listing[] = response.data.itemSummaries?.map((item: any) => ({
      marketplace: "ebay",
      title: item.title,
      price: parseFloat(item.price?.value) || 0,
      url: item.itemWebUrl,
      image_url: item.image?.imageUrl,
      posted_at: new Date(),
      metadata: { itemId: item.itemId, condition: item.condition },
    })) || [];

    return listings.slice(0, 20);
  } catch (error) {
    console.error("eBay scrape error:", error);
    return generateMockListings(query);
  }
}

function generateMockListings(query: string): Listing[] {
  const mockItems = [
    { title: "iPhone 13 Pro 128GB Unlocked", price: 599 },
    { title: "Samsung Galaxy S21 5G", price: 449 },
    { title: "Sony WH-1000XM4 Headphones", price: 249 },
    { title: "Apple Watch Series 7", price: 349 },
    { title: "iPad Air 4th Generation", price: 499 },
  ];

  return mockItems.map((item, index) => ({
    marketplace: "ebay",
    title: `${item.title} - ${query}`,
    price: item.price,
    url: `https://www.ebay.com/itm/mock-${index}`,
    posted_at: new Date(),
    metadata: { mock: true, query },
  }));
}
