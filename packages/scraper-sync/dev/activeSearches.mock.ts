/**
 * Mock Active Searches
 * Used in db-lite mode when database is not available
 */

export interface ActiveSearch {
  id: string;
  userId: string;
  marketplace: "facebook" | "vinted";
  query: string;
  isActive: boolean;
  lastRunAt: string | null;
  filters: {
    keywords?: string[];
    minPrice?: number;
    maxPrice?: number;
    maxDistanceMiles?: number;
    condition?: string[];
    location?: string;
  } | null;
}

// All mock searches (unfiltered)
const ALL_MOCK_SEARCHES: ActiveSearch[] = [
  {
    id: "mock-facebook-1",
    userId: "mock-user-1",
    marketplace: "facebook",
    query: "iphone 14",
    isActive: true,
    lastRunAt: null,
    filters: {
      keywords: ["iphone", "14"],
      minPrice: 200,
      maxPrice: 800,
      location: "New York, NY"
    }
  },
  {
    id: "mock-facebook-2",
    userId: "mock-user-1",
    marketplace: "facebook",
    query: "macbook pro",
    isActive: true,
    lastRunAt: null,
    filters: {
      keywords: ["macbook", "pro"],
      minPrice: 500,
      maxPrice: 2000,
      condition: ["like new", "excellent"]
    }
  },
  {
    id: "mock-vinted-1",
    userId: "mock-user-2",
    marketplace: "vinted",
    query: "nike tech fleece",
    isActive: true,
    lastRunAt: null,
    filters: {
      keywords: ["nike", "tech", "fleece"],
      minPrice: 20,
      maxPrice: 150,
      condition: ["new", "very good"]
    }
  }
];

// Filter by MARKETPLACES environment variable
const allowedMarketplaces =
  process.env.MARKETPLACES
    ?.split(",")
    .map((m) => m.trim().toLowerCase())
    .filter(Boolean) ?? [];

// Export filtered searches (all if MARKETPLACES is unset)
export const ACTIVE_SEARCHES = ALL_MOCK_SEARCHES.filter(
  (s) =>
    allowedMarketplaces.length === 0 ||
    allowedMarketplaces.includes(s.marketplace.toLowerCase())
);
