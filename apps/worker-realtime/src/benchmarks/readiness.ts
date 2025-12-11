/**
 * Readiness Checks
 * Validates worker readiness before starting scans
 */

import { isSystemReady } from './performance';
import { getMarketplaceProfile, MarketplaceId } from '@magnus-flipper-ai/marketplace-config';
import { validateCompliance } from '@magnus-flipper-ai/compliance-shield';
import { getCurrentBackoffSeconds } from '@magnus-flipper-ai/rate-limiter';

export interface ReadinessCheck {
  marketplace: MarketplaceId;
  ready: boolean;
  checks: {
    system: { passed: boolean; message: string };
    compliance: { passed: boolean; message: string };
    backoff: { passed: boolean; message: string; backoffSeconds?: number };
  };
  recommendations: string[];
}

/**
 * Check if marketplace is ready for scanning
 */
export async function checkMarketplaceReadiness(
  marketplace: MarketplaceId,
  dailyRequestCount: number,
  hasProxy: boolean,
  hasSession: boolean
): Promise<ReadinessCheck> {
  const profile = getMarketplaceProfile(marketplace);
  const checks: ReadinessCheck['checks'] = {
    system: { passed: false, message: '' },
    compliance: { passed: false, message: '' },
    backoff: { passed: false, message: '' },
  };
  const recommendations: string[] = [];

  // System readiness
  const systemReady = isSystemReady();
  checks.system = {
    passed: systemReady.ready,
    message: systemReady.ready
      ? 'System resources available'
      : systemReady.reasons.join('; '),
  };
  if (!systemReady.ready) {
    recommendations.push(...systemReady.reasons.map((r) => `System: ${r}`));
  }

  // Compliance check
  const compliance = validateCompliance(profile, dailyRequestCount, hasProxy, hasSession);
  checks.compliance = {
    passed: compliance.compliant,
    message: compliance.compliant
      ? 'Compliance requirements met'
      : compliance.reason || 'Compliance check failed',
  };
  if (!compliance.compliant) {
    recommendations.push(`Compliance: ${compliance.reason}`);
  }

  // Backoff check
  const backoffSeconds = await getCurrentBackoffSeconds({
    marketplace,
    ip: undefined,
    tier: 'STARTER',
  });
  const baseInterval = profile.recommendedPingIntervalSeconds;
  const inBackoff = backoffSeconds > baseInterval;
  checks.backoff = {
    passed: !inBackoff,
    message: inBackoff
      ? `In backoff: ${backoffSeconds}s (base: ${baseInterval}s)`
      : `No active backoff (interval: ${baseInterval}s)`,
    backoffSeconds: inBackoff ? backoffSeconds : undefined,
  };
  if (inBackoff) {
    const remainingMinutes = Math.ceil((backoffSeconds - baseInterval) / 60);
    recommendations.push(`Wait for backoff to expire (${remainingMinutes} minutes remaining)`);
  }

  const allPassed = checks.system.passed && checks.compliance.passed && checks.backoff.passed;

  return {
    marketplace,
    ready: allPassed,
    checks,
    recommendations,
  };
}

/**
 * Get readiness report for all marketplaces
 */
export async function getAllMarketplaceReadiness(
  dailyCounts: Record<string, number>,
  hasProxy: boolean,
  hasSession: boolean
): Promise<ReadinessCheck[]> {
  const marketplaces: MarketplaceId[] = [
    'facebook',
    'craigslist',
    'ebay',
    'vinted',
    'gumtree',
    'offerup',
  ];

  const checks = await Promise.all(
    marketplaces.map((marketplace) =>
      checkMarketplaceReadiness(
        marketplace,
        dailyCounts[marketplace] || 0,
        hasProxy,
        hasSession
      )
    )
  );

  return checks;
}
