import { getMarketplaceSettings } from "./services/supabase";
import { scanMarketplace } from "./scanner";

export async function runScheduledScan() {
  console.log("Starting scheduled scan...");

  const marketplaces = await getMarketplaceSettings();

  if (marketplaces.length === 0) {
    console.log("No enabled marketplaces found");
    return;
  }

  // Risk-tier aware scheduling: Sort by risk level (low risk first)
  const sortedMarketplaces = await Promise.all(
    marketplaces.map(async (m) => {
      try {
        const { getMarketplaceProfile } = await import('@magnus-flipper-ai/marketplace-config');
        const profile = getMarketplaceProfile(m.marketplace as any);
        return { ...m, riskLevel: profile.riskLevel };
      } catch {
        return { ...m, riskLevel: 'medium' as const };
      }
    })
  );

  // Sort: low -> medium -> high -> critical
  const riskOrder: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
  sortedMarketplaces.sort((a, b) => {
    return (riskOrder[a.riskLevel] || 1) - (riskOrder[b.riskLevel] || 1);
  });

  console.log(`Processing ${sortedMarketplaces.length} marketplaces (risk-tier sorted)`);

  for (const marketplace of sortedMarketplaces) {
    await scanMarketplace(marketplace.marketplace);
  }

  console.log("Scheduled scan complete");
}
