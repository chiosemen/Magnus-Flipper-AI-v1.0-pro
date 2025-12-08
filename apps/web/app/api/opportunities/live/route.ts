import { NextResponse } from "next/server";
import type { LiveDeal } from "../../../../marketing-swoopa/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Mock data generator
function generateMockDeals(marketplace?: string): LiveDeal[] {
  const marketplaces = [
    "eBay",
    "Amazon",
    "Facebook Marketplace",
    "Craigslist",
    "OfferUp",
    "Kijiji",
    "Gumtree",
    "Nextdoor",
  ];

  const targetMarketplace = marketplace
    ? marketplace
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : marketplaces[Math.floor(Math.random() * marketplaces.length)];

  const items = [
    "Vintage Camera",
    "Gaming Laptop",
    "Designer Handbag",
    "Electric Bike",
    "Antique Furniture",
    "Smartphone",
    "Musical Instrument",
    "Collectible Item",
    "Electronics Bundle",
    "Furniture Set",
  ];

  const locations = [
    "Dallas, TX",
    "Los Angeles, CA",
    "New York, NY",
    "Chicago, IL",
    "Miami, FL",
    "Seattle, WA",
    "Toronto, ON",
    "London, UK",
  ];

  const deals: LiveDeal[] = [];

  for (let i = 0; i < 8; i++) {
    const basePrice = Math.floor(Math.random() * 2000) + 100;
    const discount = Math.floor(Math.random() * 30) + 10;
    const currentPrice = Math.floor(basePrice * (1 - discount / 100));
    const profitEstimate = Math.floor(Math.random() * 500) + 50;

    deals.push({
      id: `deal-${targetMarketplace.toLowerCase()}-${i + 1}`,
      title: `${items[Math.floor(Math.random() * items.length)]} - Great Deal`,
      marketplace: targetMarketplace,
      url: `https://${targetMarketplace.toLowerCase().replace(/\s+/g, "")}.com/listing/${i + 1}`,
      currentPrice,
      previousPrice: basePrice,
      profitEstimate,
      currency: "USD",
      source: targetMarketplace,
      location: locations[Math.floor(Math.random() * locations.length)],
      listedAt: new Date(
        Date.now() - Math.random() * 3600000
      ).toISOString(),
    });
  }

  return deals;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const marketplace = searchParams.get("marketplace") || undefined;

    // In production, this would fetch from your actual API
    // For now, return mock data
    const deals = generateMockDeals(marketplace);

    return NextResponse.json({
      opportunities: deals,
      count: deals.length,
      marketplace: marketplace || "all",
    });
  } catch (error) {
    console.error("Error in /api/opportunities/live:", error);
    return NextResponse.json(
      { error: "Failed to fetch live deals", opportunities: [] },
      { status: 500 }
    );
  }
}
