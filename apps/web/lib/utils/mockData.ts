/**
 * Mock Data for Dev Mode
 * 
 * Provides placeholder data when NEXT_PUBLIC_SHOW_CAR_FLIPPER is enabled
 * and no real data exists.
 */

export interface MockDeal {
  id: string;
  title: string;
  marketplace: string;
  currentPrice: number;
  previousPrice?: number;
  profitEstimate?: number;
  location?: string;
  url: string;
  currency?: string;
  imageUrl?: string;
}

export const MOCK_DEALS: MockDeal[] = [
  {
    id: "mock-1",
    title: "2018 Toyota Camry - Low Mileage, Great Condition",
    marketplace: "facebook",
    currentPrice: 18500,
    previousPrice: 21000,
    profitEstimate: 2500,
    location: "San Francisco, CA",
    url: "#",
    currency: "$",
    imageUrl: "/placeholder-car.jpg",
  },
  {
    id: "mock-2",
    title: "iPhone 14 Pro Max 256GB - Unlocked",
    marketplace: "facebook",
    currentPrice: 899,
    previousPrice: 1099,
    profitEstimate: 150,
    location: "Austin, TX",
    url: "#",
    currency: "$",
  },
  {
    id: "mock-3",
    title: "MacBook Pro 2021 16\" M1 Max - Barely Used",
    marketplace: "facebook",
    currentPrice: 2100,
    profitEstimate: 400,
    location: "Seattle, WA",
    url: "#",
    currency: "$",
  },
  {
    id: "mock-4",
    title: "PlayStation 5 Bundle with 3 Games",
    marketplace: "vinted",
    currentPrice: 450,
    previousPrice: 550,
    location: "Denver, CO",
    url: "#",
    currency: "$",
  },
  {
    id: "mock-5",
    title: "Herman Miller Aeron Chair - Size B",
    marketplace: "facebook",
    currentPrice: 550,
    profitEstimate: 200,
    location: "Portland, OR",
    url: "#",
    currency: "$",
  },
  {
    id: "mock-6",
    title: "Vintage Rolex Submariner - Authenticated",
    marketplace: "ebay",
    currentPrice: 8500,
    previousPrice: 9500,
    profitEstimate: 1500,
    location: "Miami, FL",
    url: "#",
    currency: "$",
  },
];

/**
 * Get mock deals for dev mode
 */
export function getMockDeals(count: number = 6): MockDeal[] {
  return MOCK_DEALS.slice(0, count);
}

