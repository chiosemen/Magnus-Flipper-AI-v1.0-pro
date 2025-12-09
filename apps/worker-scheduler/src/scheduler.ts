import { getMarketplaceSettings } from "./services/supabase";
import { scanMarketplace } from "./scanner";

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
