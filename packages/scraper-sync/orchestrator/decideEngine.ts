/**
 * Engine Decision Logic
 * Pure function to determine which execution engine to use for a scrape job
 * Routes between Bulldog (owned infra) and Apify (managed infra)
 */

import {
  type UserTier,
  type ExecutionEngine,
  getTierPolicy,
  getMarketplaceRisk,
  tierAllowsEngine,
} from '@magnus-flipper-ai/marketplace-config';
import type { RiskLevel } from '@magnus-flipper-ai/marketplace-config';

/**
 * Saved search with routing metadata
 */
export interface SavedSearchRouting {
  id: string;
  tier: UserTier;
  cadence_seconds: number;
  execution_mode: 'auto' | 'bulldog' | 'apify';
  marketplace: string;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Bulldog health status
 */
export type BulldogHealth = 'ok' | 'degraded' | 'down';

/**
 * Engine decision input
 */
export interface EngineDecisionInput {
  search: SavedSearchRouting;
  marketplace_risk: RiskLevel;
  bulldog_health: BulldogHealth;
  apify_budget_remaining: number | null; // null = unlimited
}

/**
 * Engine decision output
 */
export interface EngineDecision {
  engine: ExecutionEngine;
  reason: string;
}

/**
 * Decide which execution engine to use for a scrape job
 *
 * Decision rules (in priority order):
 * 1. If execution_mode is explicitly set → use it
 * 2. If tier disallows Apify → Bulldog
 * 3. If marketplace is high-risk AND tier is elite → Apify
 * 4. If Bulldog is unhealthy AND tier allows Apify → Apify
 * 5. If cadence <= 300s AND tier allows Apify → Apify (high frequency needs reliability)
 * 6. If Apify budget exhausted → Bulldog
 * 7. Default → Bulldog
 *
 * @param input - Decision input parameters
 * @returns Engine decision with reason
 */
export function decideEngine(input: EngineDecisionInput): EngineDecision {
  const { search, marketplace_risk, bulldog_health, apify_budget_remaining } = input;

  // Rule 1: Explicit execution mode override
  if (search.execution_mode === 'bulldog') {
    return {
      engine: 'bulldog',
      reason: 'Explicit execution_mode: bulldog',
    };
  }

  if (search.execution_mode === 'apify') {
    // Check if tier allows Apify
    if (!tierAllowsEngine(search.tier, 'apify')) {
      return {
        engine: 'bulldog',
        reason: `Tier ${search.tier} does not allow Apify, falling back to Bulldog`,
      };
    }
    return {
      engine: 'apify',
      reason: 'Explicit execution_mode: apify',
    };
  }

  // Get tier policy
  const tierPolicy = getTierPolicy(search.tier);

  // Rule 2: Tier does not allow Apify
  if (!tierAllowsEngine(search.tier, 'apify')) {
    return {
      engine: 'bulldog',
      reason: `Tier ${search.tier} only allows Bulldog`,
    };
  }

  // Rule 3: High-risk marketplace + elite tier → Apify
  if (marketplace_risk === 'high' && search.tier === 'elite') {
    // Check budget
    if (apify_budget_remaining !== null && apify_budget_remaining <= 0) {
      return {
        engine: 'bulldog',
        reason: 'High-risk marketplace but Apify budget exhausted, using Bulldog',
      };
    }
    return {
      engine: 'apify',
      reason: 'High-risk marketplace with elite tier prefers Apify',
    };
  }

  // Rule 4: Bulldog unhealthy → Apify fallback
  if (bulldog_health !== 'ok') {
    // Check budget
    if (apify_budget_remaining !== null && apify_budget_remaining <= 0) {
      return {
        engine: 'bulldog',
        reason: `Bulldog is ${bulldog_health} but Apify budget exhausted, forcing Bulldog`,
      };
    }
    return {
      engine: 'apify',
      reason: `Bulldog is ${bulldog_health}, falling back to Apify`,
    };
  }

  // Rule 5: High-frequency cadence (≤ 5min) → Apify for reliability
  if (search.cadence_seconds <= 300) {
    // Check budget
    if (apify_budget_remaining !== null && apify_budget_remaining <= 0) {
      return {
        engine: 'bulldog',
        reason: 'High-frequency cadence but Apify budget exhausted, using Bulldog',
      };
    }
    return {
      engine: 'apify',
      reason: 'High-frequency cadence (≤5min) prefers Apify reliability',
    };
  }

  // Rule 6: Apify budget check (implicit in above rules)
  // Already handled in budget checks above

  // Rule 7: Default to Bulldog
  return {
    engine: 'bulldog',
    reason: 'Default routing to Bulldog (owned infrastructure)',
  };
}

/**
 * Helper to create decision input from search row
 * Includes marketplace risk lookup
 */
export function createDecisionInput(
  search: SavedSearchRouting,
  bulldog_health: BulldogHealth,
  apify_budget_remaining: number | null
): EngineDecisionInput {
  return {
    search,
    marketplace_risk: getMarketplaceRisk(search.marketplace),
    bulldog_health,
    apify_budget_remaining,
  };
}
