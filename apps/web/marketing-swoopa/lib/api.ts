export type LiveDeal = {
  id: string;
  title: string;
  marketplace: string;
  url: string;
  imageUrl?: string;
  currentPrice: number;
  previousPrice?: number;
  profitEstimate?: number;
  currency?: string;
  source?: string; // eBay, Amazon, etc.
  listedAt?: string;
  location?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function fetchLiveDeals(marketplace?: string): Promise<LiveDeal[]> {
  const params = marketplace
    ? `?marketplace=${encodeURIComponent(marketplace)}`
    : "";

  try {
    const res = await fetch(`${API_BASE}/api/opportunities/live${params}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch live deals: ${res.status}`);
    }

    const json = await res.json();

    // Expect shape: { opportunities: LiveDeal[] } or { deals: LiveDeal[] } or LiveDeal[]
    const deals = Array.isArray(json.opportunities)
      ? json.opportunities
      : Array.isArray(json.deals)
      ? json.deals
      : Array.isArray(json)
      ? json
      : [];

    return deals;
  } catch (error) {
    console.error("Error fetching live deals:", error);
    // Return empty array on error to prevent crashes
    return [];
  }
}
