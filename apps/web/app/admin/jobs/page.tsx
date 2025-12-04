import { AdminHeader } from "../components/AdminHeader.js";
import { MetricCard } from "../components/MetricCard.js";
import { JobStatusBadge } from "../components/JobStatusBadge.js";
import { requireAdmin } from "@/lib/admin/auth";
import { getJobStats } from "@/lib/admin";
import { logInfo } from "@/lib/observability/logger";
import { getCorrelationId } from "@/lib/observability/correlation";
import { recordLatency } from "@/lib/observability/metrics";

// PERFORMANCE: ISR - Revalidate every 60 seconds
export const revalidate = 60;

export default async function JobsPage() {
  await requireAdmin();
  
  const start = performance.now();
  const traceId = await getCorrelationId();
  
  // PERFORMANCE: getJobStats is now cached via React cache()
  const { jobs, workers } = await getJobStats();
  
  const duration = performance.now() - start;
  const durationMs = Math.round(duration);
  
  // PERFORMANCE: Record page load metrics
  recordLatency("page.admin.jobs", durationMs);
  
  logInfo("Render Admin Jobs Page", { traceId, duration: durationMs, jobCount: jobs.length, workerCount: workers.length });

  const pendingJobs = jobs.filter((j) => j.status === "pending");
  const activeJobs = jobs.filter((j) => j.status === "active");
  const failedJobs = jobs.filter((j) => j.status === "failed");
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const onlineWorkers = workers.filter((w) => w.status === "online");

  const avgProcessingTime = activeJobs.length > 0
    ? Math.round(
        activeJobs.reduce((sum, job) => {
          if (job.started_at) {
            const duration = Date.now() - new Date(job.started_at).getTime();
            return sum + duration;
          }
          return sum;
        }, 0) / activeJobs.length / 1000
      )
    : 0;

  return (
    <div>
      <AdminHeader
        title="Job Monitoring"
        subtitle="Background jobs and worker status"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <MetricCard
          label="Pending Jobs"
          value={pendingJobs.length}
          variant="warning"
        />
        <MetricCard
          label="Active Jobs"
          value={activeJobs.length}
          variant="success"
        />
        <MetricCard label="Completed" value={completedJobs.length} />
        <MetricCard
          label="Failed Jobs"
          value={failedJobs.length}
          variant={failedJobs.length > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Online Workers"
          value={onlineWorkers.length}
          variant={onlineWorkers.length > 0 ? "success" : "danger"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <MetricCard
          label="Avg Processing Time"
          value={`${avgProcessingTime}s`}
        />
        <MetricCard label="Total Jobs (24h)" value={jobs.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
          <div className="p-6 border-b border-[#2a2a2a]">
            <h3 className="text-lg font-semibold text-[#ededed]">
              Worker Status
            </h3>
          </div>
          <div className="divide-y divide-[#2a2a2a] max-h-96 overflow-y-auto">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="p-4 flex items-center justify-between hover:bg-[#0a0a0a] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      worker.status === "online"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  <div>
                    <div className="text-sm font-medium text-[#ededed]">
                      {worker.worker_id}
                    </div>
                    <div className="text-xs text-[#666]">
                      Last heartbeat:{" "}
                      {new Date(worker.last_heartbeat).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    worker.status === "online"
                      ? "bg-green-500/20 text-green-500"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {worker.status}
                </span>
              </div>
            ))}
            {workers.length === 0 && (
              <div className="p-8 text-center text-[#666]">
                No workers registered
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
          <div className="p-6 border-b border-[#2a2a2a]">
            <h3 className="text-lg font-semibold text-[#ededed]">
              Active Jobs
            </h3>
          </div>
          <div className="divide-y divide-[#2a2a2a] max-h-96 overflow-y-auto">
            {activeJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 hover:bg-[#0a0a0a] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-[#ededed]">
                      {job.job_type}
                    </div>
                    <div className="text-xs text-[#666]">
                      {job.marketplace || "N/A"} • Worker: {job.worker_id || "N/A"}
                    </div>
                  </div>
                  <JobStatusBadge status={job.status} />
                </div>
                {job.started_at && (
                  <div className="text-xs text-[#a0a0a0]">
                    Started: {new Date(job.started_at).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
            {activeJobs.length === 0 && (
              <div className="p-8 text-center text-[#666]">No active jobs</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
        <div className="p-6 border-b border-[#2a2a2a]">
          <h3 className="text-lg font-semibold text-[#ededed]">Recent Jobs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#a0a0a0] uppercase">
                  Job Type
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#a0a0a0] uppercase">
                  Marketplace
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#a0a0a0] uppercase">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#a0a0a0] uppercase">
                  Worker
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#a0a0a0] uppercase">
                  Created
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#a0a0a0] uppercase">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {jobs.slice(0, 20).map((job) => (
                <tr key={job.id} className="hover:bg-[#0a0a0a] transition-colors">
                  <td className="px-6 py-4 text-sm text-[#ededed]">
                    {job.job_type}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#a0a0a0]">
                    {job.marketplace || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <JobStatusBadge status={job.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-[#a0a0a0]">
                    {job.worker_id || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#a0a0a0]">
                    {new Date(job.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#a0a0a0]">
                    {job.completed_at
                      ? new Date(job.completed_at).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && (
            <div className="p-8 text-center text-[#666]">No jobs found</div>
          )}
        </div>
      </div>
    </div>
  );
}
