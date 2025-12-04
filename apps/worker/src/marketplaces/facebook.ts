import type { Listing } from "./craigslist";

export async function scrapeListings(query: string = "furniture"): Promise<Listing[]> {
  console.warn("Facebook Marketplace requires authentication - using mock data");

  const mockItems = [
    { title: "Vintage Oak Dining Table", price: 250 },
    { title: "IKEA Malm Bed Frame Queen", price: 120 },
    { title: "Herman Miller Aeron Chair", price: 450 },
    { title: "Sectional Sofa L-Shape", price: 600 },
    { title: "Bookshelf Solid Wood", price: 80 },
  ];

  return mockItems.map((item, index) => ({
    marketplace: "facebook",
    title: `${item.title} - ${query}`,
    price: item.price,
    url: `https://www.facebook.com/marketplace/item/mock-${index}`,
    posted_at: new Date(),
    metadata: { mock: true, query },
  }));
}
