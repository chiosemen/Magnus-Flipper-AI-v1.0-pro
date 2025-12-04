import { AdminHeader } from "../components/AdminHeader";
import { MetricCard } from "../components/MetricCard";
import { requireAdmin } from "@/lib/admin/auth";
import { getTelemetryMetrics, getScannerTelemetry } from "@/lib/admin";
import { logInfo } from "@/lib/observability/logger";
import { getCorrelationId } from "@/lib/observability/correlation";
import { recordLatency } from "@/lib/observability/metrics";

// PERFORMANCE: ISR - Revalidate every 30 seconds (telemetry changes frequently)
export const revalidate = 30;

export default async function ScannersPage() {
  await requireAdmin();
  
  const start = performance.now();
  const traceId = await getCorrelationId();
  
  // PERFORMANCE: Parallel data fetching (both are cached via React cache())
  const [metrics, telemetry] = await Promise.all([
    getTelemetryMetrics(),
    getScannerTelemetry(),
  ]);
  
  const duration = performance.now() - start;
  const durationMs = Math.round(duration);
  
  // PERFORMANCE: Record page load metrics
  recordLatency("page.admin.scanners", durationMs);
  
  logInfo("Render Admin Scanners Page", { traceId, duration: durationMs, telemetryCount: telemetry.length });

  return (
    <div>
      <AdminHeader
        title="Scanner Telemetry"
        subtitle="Real-time monitoring and performance metrics"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          label="Active Scanners"
          value={metrics.activeScanners}
          variant="success"
        />
        <MetricCard
          label="Total Processed (24h)"
          value={metrics.totalProcessed.toLocaleString()}
        />
        <MetricCard
          label="Errors (24h)"
          value={metrics.errorsLast24h}
          variant={metrics.errorsLast24h > 10 ? "warning" : "default"}
        />
        <MetricCard
          label="Avg Latency"
          value={`${metrics.avgLatency}ms`}
        />
        <MetricCard
          label="Success Rate"
          value={`${metrics.successRate}%`}
          variant="success"
        />
        <MetricCard label="Queue Depth" value={metrics.queueDepth} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <h3 className="text-sm font-semibold text-[#ededed] mb-4">
            Listings per Hour
          </h3>
          <div
            className="bg-[#0a0a0a] rounded h-48 flex items-center justify-center"
          >
            <span className="text-[#666] text-sm">Chart placeholder</span>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <h3 className="text-sm font-semibold text-[#ededed] mb-4">
            Error Rate Trend
          </h3>
          <div
            className="bg-[#0a0a0a] rounded h-48 flex items-center justify-center"
          >
            <span className="text-[#666] text-sm">Chart placeholder</span>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <h3 className="text-sm font-semibold text-[#ededed] mb-4">
            Latency Sparkline
          </h3>
          <div
            className="bg-[#0a0a0a] rounded h-48 flex items-center justify-center"
          >
            <span className="text-[#666] text-sm">Chart placeholder</span>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
        <div className="p-6 border-b border-[#2a2a2a]">
          <h3 className="text-lg font-semibold text-[#ededed]">Live Event Log</h3>
        </div>
        <div className="divide-y divide-[#2a2a2a] max-h-96 overflow-y-auto">
          {telemetry.map((event) => (
            <div key={event.id} className="p-4 hover:bg-[#0a0a0a] transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      event.success ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <div>
                    <span className="text-sm font-medium text-[#ededed] capitalize">
                      {event.marketplace}
                    </span>
                    <span className="text-sm text-[#a0a0a0] mx-2">•</span>
                    <span className="text-sm text-[#a0a0a0]">{event.event}</span>
                  </div>
                </div>
                <div className="text-xs text-[#666]">
                  {new Date(event.created_at).toLocaleTimeString()}
                </div>
              </div>
              {event.payload && (
                <div className="ml-5 text-xs text-[#666] font-mono">
                  {JSON.stringify(event.payload).slice(0, 100)}
                  {JSON.stringify(event.payload).length > 100 && "..."}
                </div>
              )}
              {event.latency_ms && (
                <div className="ml-5 text-xs text-[#a0a0a0]">
                  Latency: {event.latency_ms}ms
                </div>
              )}
            </div>
          ))}
          {telemetry.length === 0 && (
            <div className="p-8 text-center text-[#666]">
              No telemetry data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
