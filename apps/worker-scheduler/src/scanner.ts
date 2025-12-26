import { getMarketplaceSettings } from "./services/supabase.js";
import { getMarketplaceProfile, MarketplaceId } from '@magnus-flipper-ai/marketplace-config';
import { getCurrentBackoffSeconds } from '@magnus-flipper-ai/rate-limiter';

/**
 * Risk-tier based scanner
 * Schedules scans based on marketplace risk level and backoff status
 */
export async function scanMarketplace(marketplaceName: string) {
  if (process.env.NODE_ENV !== "production") {
    const guardState = globalThis as {
      __ENTITLEMENT_CHECK_PASSED__?: boolean;
      __EMERGENCY_OFF_ACTIVE__?: boolean;
    };

    if (guardState.__EMERGENCY_OFF_ACTIVE__) {
      throw new Error("scanMarketplace called during emergency_off");
    }

    if (
      process.env.EXECUTION_MODE === "public" &&
      !guardState.__ENTITLEMENT_CHECK_PASSED__
    ) {
      throw new Error("scanMarketplace called without entitlement check");
    }
  }

  // TODO: Implement actual marketplace scanning logic
  // For now, this is a placeholder that will be implemented
  console.log(`Scanning marketplace: ${marketplaceName}`);
  return Promise.resolve();
}

/**
 * Get next scan time for a marketplace based on risk tier
 */
export async function getNextScanTime(marketplaceName: string): Promise<number> {
  try {
    const profile = getMarketplaceProfile(marketplaceName as MarketplaceId);
    const backoffSeconds = await getCurrentBackoffSeconds({
      marketplace: marketplaceName as MarketplaceId,
      ip: undefined,
      tier: 'STARTER'
    });

    // Use backoff time if active, otherwise use recommended interval
    const baseInterval = backoffSeconds > profile.recommendedPingIntervalSeconds
      ? backoffSeconds
      : profile.recommendedPingIntervalSeconds;

    // Apply jitter
    const jitter = profile.jitterSeconds * (Math.random() * 2 - 1); // ±jitter
    const interval = Math.max(
      profile.recommendedPingIntervalSeconds * 0.5, // Minimum 50% of base
      baseInterval + jitter
    );

    // Risk-tier multiplier
    const riskMultipliers: Record<string, number> = {
      low: 0.8,
      medium: 1.0,
      high: 1.5,
      critical: 2.0,
    };
    const multiplier = riskMultipliers[profile.riskLevel] || 1.0;

    return Math.floor(interval * multiplier * 1000); // Convert to ms
  } catch {
    return 300000; // Default 5 minutes
  }
}

/**
 * Schedule all marketplaces with risk-tier awareness
 */
export async function scheduleAllMarketplaces(): Promise<Map<string, number>> {
  const marketplaces = await getMarketplaceSettings();
  const schedule = new Map<string, number>();

  for (const marketplace of marketplaces) {
    if (!marketplace.enabled) continue;

    const nextScanTime = await getNextScanTime(marketplace.marketplace);
    schedule.set(marketplace.marketplace, nextScanTime);
  }

  return schedule;
}
