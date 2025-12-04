// apps/web/app/dashboard-exec/page.tsx

import { Suspense } from "react";
import {
  fetchHealthSummary,
  fetchWorkerMetrics,
  fetchSystemLoad,
  fetchSupabaseStatus,
} from "@/lib/monitoringClient";
import { SummaryCards } from "./components/SummaryCards";
import { WorkerStatusPills } from "./components/WorkerStatusPills";
import { WorkerGrid } from "./components/WorkerGrid";
import { WorkerHealthTable } from "./components/WorkerHealthTable";
import { MetricsCharts } from "./components/MetricsCharts";
import { LoadPanel } from "./components/LoadPanel";
import { SupabaseCard } from "./components/SupabaseCard";
import type { WorkerName } from "@magnus-flipper-ai/core";

const PRIMARY_WORKER: WorkerName = "worker-scraper";

// PERFORMANCE: ISR - Revalidate every 30 seconds for near-real-time updates
export const revalidate = 30;

async function DashboardContent() {
  // Parallel data fetching for optimal performance
  const [health, primaryMetrics, systemLoad, supabase] = await Promise.all([
    fetchHealthSummary(),
    fetchWorkerMetrics(PRIMARY_WORKER),
    fetchSystemLoad(),
    fetchSupabaseStatus(),
  ]);

  return (
    <main className="flex flex-col gap-6 p-6">
      {/* Header */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#ededed]">
              Executive Monitoring Dashboard
            </h1>
            <p className="text-sm text-[#a0a0a0] mt-1">
              Real-time worker health, metrics, and system load
            </p>
          </div>
          <span className="text-xs text-[#a0a0a0]">
            Updated: {new Date(health.generatedAt).toLocaleTimeString()}
          </span>
        </div>
        <WorkerStatusPills data={health} />
      </section>

      {/* Summary Cards */}
      <section>
        <SummaryCards healthData={health} />
      </section>

      {/* Worker Grid */}
      <section>
        <WorkerGrid data={health} />
      </section>

      {/* Main Content Grid */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Worker Health Table */}
        <div className="lg:col-span-2">
          <WorkerHealthTable data={health} />
        </div>

        {/* System Load & Supabase */}
        <div className="space-y-4">
          <LoadPanel data={systemLoad} />
          <SupabaseCard data={supabase} />
        </div>
      </section>

      {/* Metrics Charts */}
      <section>
        <MetricsCharts metrics={primaryMetrics} />
      </section>
    </main>
  );
}

function LoadingSkeleton() {
  return (
    <main className="flex flex-col gap-6 p-6">
      <div className="h-32 bg-[#1a1a1a] rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-[#1a1a1a] rounded-lg animate-pulse" />
        ))}
      </div>
    </main>
  );
}

export default function MonitoringPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

