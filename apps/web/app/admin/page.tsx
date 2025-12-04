import { AdminHeader } from "./components/AdminHeader";
import { MetricCard } from "./components/MetricCard";
import { requireAdmin } from "@/lib/admin/auth";
import { getTelemetryMetrics, getJobStats } from "@/lib/admin";
import { logInfo } from "@/lib/observability/logger";
import { getCorrelationId } from "@/lib/observability/correlation";
import { recordLatency } from "@/lib/observability/metrics";
import { Suspense } from "react";

// PERFORMANCE: ISR - Revalidate every 60 seconds
export const revalidate = 60;

export default async function AdminOverviewPage() {
  await requireAdmin();
  
  const start = performance.now();
  const traceId = await getCorrelationId();
  
  // PERFORMANCE: Parallel data fetching (both are cached via React cache())
  const [metrics, jobStats] = await Promise.all([
    getTelemetryMetrics(),
    getJobStats(),
  ]);
  
  const { jobs, workers } = jobStats;
  
  const duration = performance.now() - start;
  const durationMs = Math.round(duration);
  
  // PERFORMANCE: Record page load metrics
  recordLatency("page.admin.overview", durationMs);
  
  logInfo("Render Admin Overview Page", { traceId, duration: durationMs });

  const pendingJobs = jobs.filter((j) => j.status === "pending").length;
  const activeJobs = jobs.filter((j) => j.status === "active").length;
  const failedJobs = jobs.filter((j) => j.status === "failed").length;
  const onlineWorkers = workers.filter((w) => w.status === "online").length;

  return (
    <div>
      <AdminHeader
        title="Admin Overview"
        subtitle="System-wide metrics and monitoring"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          label="Success Rate"
          value={`${metrics.successRate}%`}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          label="Avg Latency"
          value={`${metrics.avgLatency}ms`}
        />
        <MetricCard label="Queue Depth" value={metrics.queueDepth} />
        <MetricCard label="Pending Jobs" value={pendingJobs} />
        <MetricCard
          label="Online Workers"
          value={onlineWorkers}
          variant={onlineWorkers > 0 ? "success" : "danger"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#ededed] mb-4">
            Recent Jobs
          </h3>
          <div className="space-y-2">
            {jobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded"
              >
                <div>
                  <div className="text-sm text-[#ededed]">{job.job_type}</div>
                  <div className="text-xs text-[#666]">
                    {job.marketplace || "N/A"}
                  </div>
                </div>
                <div className="text-xs text-[#a0a0a0]">
                  {new Date(job.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#ededed] mb-4">
            Worker Status
          </h3>
          <div className="space-y-2">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      worker.status === "online"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  <div className="text-sm text-[#ededed]">
                    {worker.worker_id}
                  </div>
                </div>
                <div className="text-xs text-[#a0a0a0]">
                  {new Date(worker.last_heartbeat).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {workers.length === 0 && (
              <div className="text-center text-sm text-[#666] py-4">
                No workers online
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
