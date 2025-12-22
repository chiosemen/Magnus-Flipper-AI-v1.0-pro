/**
 * Elite Pool Diagnostics
 * 
 * Explicit logging and diagnostics for Elite Pool execution.
 * Use this to verify pool logic is working vs just logging.
 */

import type { EliteGovernanceResult } from "./services/elitePoolGovernance.js";
import { getEnabledElitePools } from "@magnus-flipper-ai/marketplace-config";

const WORKER_ID = process.env.WORKER_ID || "worker-scheduler";

export interface PoolDiagnostics {
  timestamp: string;
  governance: {
    enabled: boolean;
    allowed: boolean;
    action: string;
    coverageRatio: number;
    monthlyRevenue: number;
    monthlyCost: number;
    headroomUSD: number;
    subscriberCount: number;
  };
  pools: {
    total: number;
    enabled: number;
    active: number;
    paused: number;
    skipped: number;
  };
  dispatch: {
    jobsEnqueued: number;
    lastDispatchTime: string | null;
  };
}

/**
 * Generate comprehensive diagnostics report
 */
export function generateDiagnostics(
  governanceResult: EliteGovernanceResult | null,
  jobsDispatched: number = 0
): PoolDiagnostics {
  const allPools = getEnabledElitePools();
  const activePools = governanceResult
    ? governanceResult.governedPools.filter((p) => !p.shouldSkip)
    : [];
  const pausedPools = governanceResult
    ? governanceResult.governedPools.filter((p) => p.shouldSkip)
    : [];

  return {
    timestamp: new Date().toISOString(),
    governance: governanceResult
      ? {
          enabled: true,
          allowed: governanceResult.allowed,
          action: governanceResult.policy.action,
          coverageRatio: governanceResult.coverage.coverageRatio,
          monthlyRevenue: governanceResult.coverage.monthlyRevenue,
          monthlyCost: governanceResult.coverage.monthlyCost,
          headroomUSD: governanceResult.coverage.headroomUSD,
          subscriberCount: governanceResult.config.subscriberCount,
        }
      : {
          enabled: false,
          allowed: false,
          action: "NOT_CHECKED",
          coverageRatio: 0,
          monthlyRevenue: 0,
          monthlyCost: 0,
          headroomUSD: 0,
          subscriberCount: 0,
        },
    pools: {
      total: allPools.length,
      enabled: allPools.length,
      active: activePools.length,
      paused: pausedPools.length,
      skipped: pausedPools.length,
    },
    dispatch: {
      jobsEnqueued: jobsDispatched,
      lastDispatchTime: jobsDispatched > 0 ? new Date().toISOString() : null,
    },
  };
}

/**
 * Log diagnostics in human-readable format
 */
export function logDiagnostics(diagnostics: PoolDiagnostics): void {
  console.log(`[${WORKER_ID}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[${WORKER_ID}] 📊 ELITE POOL DIAGNOSTICS`);
  console.log(`[${WORKER_ID}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[${WORKER_ID}] Timestamp: ${diagnostics.timestamp}`);
  console.log(`[${WORKER_ID}] `);
  console.log(`[${WORKER_ID}] GOVERNANCE:`);
  console.log(`[${WORKER_ID}]   Enabled: ${diagnostics.governance.enabled ? "✅" : "❌"}`);
  console.log(`[${WORKER_ID}]   Allowed: ${diagnostics.governance.allowed ? "✅" : "❌"}`);
  console.log(`[${WORKER_ID}]   Action: ${diagnostics.governance.action}`);
  console.log(`[${WORKER_ID}]   Coverage Ratio: ${diagnostics.governance.coverageRatio.toFixed(2)}`);
  console.log(`[${WORKER_ID}]   Monthly Revenue: $${diagnostics.governance.monthlyRevenue.toFixed(2)}`);
  console.log(`[${WORKER_ID}]   Monthly Cost: $${diagnostics.governance.monthlyCost.toFixed(2)}`);
  console.log(`[${WORKER_ID}]   Headroom: $${diagnostics.governance.headroomUSD.toFixed(2)}`);
  console.log(`[${WORKER_ID}]   Subscribers: ${diagnostics.governance.subscriberCount}`);
  console.log(`[${WORKER_ID}] `);
  console.log(`[${WORKER_ID}] POOLS:`);
  console.log(`[${WORKER_ID}]   Total: ${diagnostics.pools.total}`);
  console.log(`[${WORKER_ID}]   Enabled: ${diagnostics.pools.enabled}`);
  console.log(`[${WORKER_ID}]   Active: ${diagnostics.pools.active}`);
  console.log(`[${WORKER_ID}]   Paused: ${diagnostics.pools.paused}`);
  console.log(`[${WORKER_ID}] `);
  console.log(`[${WORKER_ID}] DISPATCH:`);
  console.log(`[${WORKER_ID}]   Jobs Enqueued: ${diagnostics.dispatch.jobsEnqueued}`);
  console.log(`[${WORKER_ID}]   Last Dispatch: ${diagnostics.dispatch.lastDispatchTime || "Never"}`);
  console.log(`[${WORKER_ID}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

/**
 * Verify pool execution is working (not just logging)
 */
export function verifyPoolExecution(diagnostics: PoolDiagnostics): {
  isWorking: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!diagnostics.governance.enabled) {
    issues.push("Governance is disabled - no pools configured");
  }

  if (diagnostics.governance.enabled && !diagnostics.governance.allowed) {
    issues.push("Governance blocked execution - check coverage ratio");
  }

  if (diagnostics.pools.enabled > 0 && diagnostics.pools.active === 0) {
    issues.push("Pools are enabled but none are active - all may be paused");
  }

  if (diagnostics.pools.active > 0 && diagnostics.dispatch.jobsEnqueued === 0) {
    issues.push("Active pools exist but no jobs were dispatched - dispatch logic may be broken");
  }

  const isWorking =
    diagnostics.governance.enabled &&
    diagnostics.governance.allowed &&
    diagnostics.pools.active > 0 &&
    diagnostics.dispatch.jobsEnqueued > 0;

  return { isWorking, issues };
}

