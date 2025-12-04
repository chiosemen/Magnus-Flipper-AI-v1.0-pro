// apps/web/src/lib/admin/index.ts

/**
 * Admin module exports
 * Re-exports from specific admin modules
 */

// Auth
export { requireAdmin, isAdmin, checkAdminAccess } from "./auth";

// Jobs
export { fetchAllJobs as getJobStats, getJobById } from "./jobs";

// Scanners
export { fetchScanners, getScannerMetrics, getScannerTelemetry } from "./scanners";

// Marketplaces
export { getMarketplaceSettings, toggleMarketplace } from "./marketplaces";

// Telemetry metrics (aggregated)
export async function getTelemetryMetrics() {
  const { getScannerMetrics } = await import("./scanners");
  const metrics = await getScannerMetrics();
  
  return {
    totalUsers: 0, // TODO: Query from Supabase
    activeUsers: 0, // TODO: Query from Supabase
    apiRequests: 0, // TODO: Query from analytics
    systemHealth: 100,
    activeScanners: metrics.activeScanners,
    totalProcessed: metrics.totalProcessed,
    errorsLast24h: metrics.errorsLast24h,
    successRate: metrics.successRate,
    avgLatency: metrics.avgLatency,
    queueDepth: metrics.queueDepth,
  };
}
