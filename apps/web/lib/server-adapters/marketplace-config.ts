/**
 * Server Adapter: Marketplace Config
 * Decoupled from @magnus-flipper-ai/marketplace-config
 */

import type { ElitePoolConfig } from "@/lib/types/marketplace";

/**
 * Get all elite pool configurations
 * STUB: Returns empty array - elite pools managed by workers
 */
export function getAllElitePools(): ElitePoolConfig[] {
  return [];
}

/**
 * Get enabled elite pool configurations
 * STUB: Returns empty array - elite pools managed by workers
 */
export function getEnabledElitePools(): ElitePoolConfig[] {
  return [];
}

/**
 * Calculate total monthly compute units
 * STUB: Returns 0 - compute tracking handled by workers
 */
export function calculateTotalMonthlyCU(pools: ElitePoolConfig[]): number {
  return 0;
}

/**
 * Calculate elite coverage metrics
 * STUB: Returns safe defaults - coverage metrics handled by workers
 */
export function calculateEliteCoverage(params: {
  eliteSubscriberCount: number;
  elitePrice: number;
  enabledPools: ElitePoolConfig[];
}): {
  monthlyRevenue: number;
  monthlyCost: number;
  enabledPoolCount: number;
  coverageRatio: number;
  headroomUSD: number;
} {
  const monthlyRevenue = params.eliteSubscriberCount * params.elitePrice;
  const monthlyCost = 0; // Stub: actual cost calculated by workers
  const enabledPoolCount = params.enabledPools.length;

  return {
    monthlyRevenue,
    monthlyCost,
    enabledPoolCount,
    coverageRatio: monthlyRevenue > 0 ? Infinity : 0,
    headroomUSD: monthlyRevenue - monthlyCost
  };
}
