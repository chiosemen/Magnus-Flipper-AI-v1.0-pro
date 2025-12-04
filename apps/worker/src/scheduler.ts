import { getMarketplaceSettings, saveListings, updateMarketplaceSync } from "./services/supabase";
import { logEvent } from "./services/telemetry";
import * as craigslist from "./marketplaces/craigslist";
import * as gumtree from "./marketplaces/gumtree";
import * as ebay from "./marketplaces/ebay";
import * as vinted from "./marketplaces/vinted";
import * as facebook from "./marketplaces/facebook";
import * as offerup from "./marketplaces/offerup";

const scrapers: Record<string, (query?: string) => Promise<any[]>> = {
  craigslist: craigslist.scrapeListings,
  gumtree: gumtree.scrapeListings,
  ebay: ebay.scrapeListings,
  vinted: vinted.scrapeListings,
  facebook: facebook.scrapeListings,
  offerup: offerup.scrapeListings,
};

export async function runScheduledScan() {
  console.log("Starting scheduled scan...");

  const marketplaces = await getMarketplaceSettings();

  if (marketplaces.length === 0) {
    console.log("No enabled marketplaces found");
    return;
  }

  for (const marketplace of marketplaces) {
    await scanMarketplace(marketplace.marketplace);
  }

  console.log("Scheduled scan complete");
}

export async function scanMarketplace(marketplaceName: string) {
  const scraper = scrapers[marketplaceName];

  if (!scraper) {
    console.error(`No scraper found for ${marketplaceName}`);
    return;
  }

  console.log(`Scanning ${marketplaceName}...`);

  const startTime = Date.now();

  try {
    const listings = await scraper();
    const latency = Date.now() - startTime;

    if (listings.length > 0) {
      await saveListings(listings);
      console.log(`Saved ${listings.length} listings from ${marketplaceName}`);
    }

    await updateMarketplaceSync(marketplaceName);

    await logEvent(marketplaceName, "scan_completed", {
      success: true,
      latency_ms: latency,
      payload: { count: listings.length },
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error(`Error scanning ${marketplaceName}:`, error);

    await logEvent(marketplaceName, "scan_failed", {
      success: false,
      latency_ms: latency,
      payload: { error: errorMessage },
    });
  }
}
