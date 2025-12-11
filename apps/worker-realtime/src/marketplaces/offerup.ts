import type { Listing } from "./craigslist";

export async function scrapeListings(query: string = "electronics"): Promise<Listing[]> {
  console.warn("OfferUp requires API access - using mock data");

  const mockItems = [
    { title: "PS5 Digital Edition", price: 350 },
    { title: "Xbox Series X Console", price: 400 },
    { title: "Nintendo Switch OLED", price: 280 },
    { title: "MacBook Pro 2020 M1", price: 900 },
    { title: "Dell XPS 15 Laptop", price: 750 },
  ];

  return mockItems.map((item, index) => ({
    marketplace: "offerup",
    title: `${item.title} - ${query}`,
    price: item.price,
    url: `https://offerup.com/item/detail/mock-${index}`,
    posted_at: new Date(),
    metadata: { mock: true, query },
  }));
}
