// apps/web/src/lib/admin/index.ts

/**
 * Admin module exports
 * Re-exports from specific admin modules
 */

// Auth
export { requireAdmin, isAdmin, checkAdminAccess } from "./auth";

// Jobs
export { fetchAllJobs as getJobStats, getJobById } from "./jobs";

// Scanners (quarantined - uses worker packages)
// export { fetchScanners, getScannerMetrics, getScannerTelemetry } from "./scanners";

// Marketplaces
export { getMarketplaceSettings, toggleMarketplace } from "./marketplaces";

// Telemetry metrics (stub - scanners quarantined)
export async function getTelemetryMetrics() {
  return {
    totalUsers: 0,
    activeUsers: 0,
    apiRequests: 0,
    systemHealth: 100,
    activeScanners: 0,
    totalProcessed: 0,
    errorsLast24h: 0,
    successRate: "100.0",
    avgLatency: 0,
    queueDepth: 0,
  };
}
