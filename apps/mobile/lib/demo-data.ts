import type { SavedSearch, Alert, Listing } from "@/lib/api";

export const MOBILE_DEMO_SEARCHES: SavedSearch[] = [
  {
    id: "m-demo-1",
    userId: "demo",
    name: "iPhone flips NYC",
    category: "Phones",
    manufacturer: "Apple",
    minPrice: 200,
    maxPrice: 800,
    radiusMiles: 20,
    conditions: ["GOOD"],
    maxResultsPerRun: 20,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastRunAt: new Date().toISOString(),
  } as SavedSearch,
];

export const MOBILE_DEMO_ALERTS: Alert[] = [
  {
    id: "m-alert-1",
    saved_search_id: "m-demo-1",
    listing_id: "m-listing-1",
    created_at: new Date().toISOString(),
    notified: true,
  },
];

export const MOBILE_DEMO_LISTINGS: Listing[] = [
  {
    id: "m-listing-1",
    title: "iPhone 14 Pro - Unlocked",
    price: 720,
    site: "FB_MARKETPLACE",
    location: "Brooklyn",
    description: "Great condition, battery 90%",
  },
];
