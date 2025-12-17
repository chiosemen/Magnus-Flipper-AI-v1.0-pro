/**
 * Routing Policy Configuration
 * Defines tier-based routing rules for marketplace scraping execution
 *
 * Routes searches between:
 * - Bulldog (owned infrastructure)
 * - Apify (managed infrastructure)
 */

import type { RiskLevel } from './types';

export type UserTier = 'free' | 'starter' | 'pro' | 'elite';
export type ExecutionEngine = 'bulldog' | 'apify';

export interface TierPolicy {
  tier: UserTier;
  allowedCadenceSeconds: number[];
  defaultEngine: ExecutionEngine;
  allowedEngines: ExecutionEngine[];
  boostAllowed: boolean;
  monthlyApifyAllowanceRuns: number | null;
}

export interface MarketplaceRiskConfig {
  marketplace: string;
  riskLevel: RiskLevel;
}

export interface RoutingPolicyConfig {
  tiers: Record<UserTier, TierPolicy>;
  marketplaceRisks: MarketplaceRiskConfig[];
}

/**
 * Core routing policy constant
 * Defines tier-based execution routing rules
 */
export const ROUTING_POLICY: RoutingPolicyConfig = {
  tiers: {
    free: {
      tier: 'free',
      allowedCadenceSeconds: [900, 1800], // 15min, 30min
      defaultEngine: 'bulldog',
      allowedEngines: ['bulldog'],
      boostAllowed: false,
      monthlyApifyAllowanceRuns: null, // No Apify access
    },
    starter: {
      tier: 'starter',
      allowedCadenceSeconds: [600, 900], // 10min, 15min
      defaultEngine: 'bulldog',
      allowedEngines: ['bulldog', 'apify'], // Apify only as fallback
      boostAllowed: false,
      monthlyApifyAllowanceRuns: 10, // 10 fallback runs per month
    },
    pro: {
      tier: 'pro',
      allowedCadenceSeconds: [300, 600], // 5min, 10min
      defaultEngine: 'bulldog',
      allowedEngines: ['bulldog', 'apify'],
      boostAllowed: true,
      monthlyApifyAllowanceRuns: 100, // 100 Apify runs per month
    },
    elite: {
      tier: 'elite',
      allowedCadenceSeconds: [180, 300], // 3min, 5min
      defaultEngine: 'bulldog', // Default to bulldog, Apify for high-risk
      allowedEngines: ['bulldog', 'apify'],
      boostAllowed: true,
      monthlyApifyAllowanceRuns: null, // Unlimited Apify access
    },
  },
  marketplaceRisks: [
    { marketplace: 'facebook', riskLevel: 'high' },
    { marketplace: 'offerup', riskLevel: 'high' },
    { marketplace: 'ebay', riskLevel: 'medium' },
    { marketplace: 'vinted', riskLevel: 'medium' },
    { marketplace: 'gumtree', riskLevel: 'medium' },
    { marketplace: 'craigslist', riskLevel: 'medium' },
    { marketplace: 'depop', riskLevel: 'medium' },
  ],
};

/**
 * Get tier policy for a given user tier
 */
export function getTierPolicy(tier: UserTier): TierPolicy {
  const policy = ROUTING_POLICY.tiers[tier];
  if (!policy) {
    throw new Error(`Unknown tier: ${tier}`);
  }
  return policy;
}

/**
 * Get marketplace risk level
 * Returns 'medium' as default for unknown marketplaces
 */
export function getMarketplaceRisk(marketplace: string): RiskLevel {
  const config = ROUTING_POLICY.marketplaceRisks.find(
    (r) => r.marketplace.toLowerCase() === marketplace.toLowerCase()
  );
  return config?.riskLevel || 'medium';
}

/**
 * Check if a tier allows a specific engine
 */
export function tierAllowsEngine(tier: UserTier, engine: ExecutionEngine): boolean {
  const policy = getTierPolicy(tier);
  return policy.allowedEngines.includes(engine);
}

/**
 * Check if a cadence is allowed for a tier
 */
export function isCadenceAllowed(tier: UserTier, cadenceSeconds: number): boolean {
  const policy = getTierPolicy(tier);
  return policy.allowedCadenceSeconds.includes(cadenceSeconds);
}
