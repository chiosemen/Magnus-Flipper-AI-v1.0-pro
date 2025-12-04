// apps/web/app/dashboard-exec/components/SummaryCards.tsx

"use client";

import type { HealthSummaryResponse } from "@magnus-flipper-ai/core";

type Props = {
  healthData: HealthSummaryResponse;
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  healthy: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/40",
  },
  degraded: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/40",
  },
  unhealthy: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/40",
  },
};

export function SummaryCards({ healthData }: Props) {
  const statusColor = STATUS_COLORS[healthData.overallStatus] ?? STATUS_COLORS.healthy;
  
  const maxErrors = Math.max(...healthData.workers.map((w) => w.errorCount15m), 0);
  const avgFailureRate =
    healthData.workers.reduce((sum, w) => sum + w.failureRate, 0) /
    healthData.workers.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* System Health Index */}
      <div
        className={`bg-[#1a1a1a] border ${statusColor.border} rounded-lg p-6 ${statusColor.bg}`}
      >
        <div className="text-sm text-[#a0a0a0] mb-2">System Health</div>
        <div className={`text-3xl font-bold ${statusColor.text} mb-1`}>
          {healthData.overallStatus.toUpperCase()}
        </div>
        <div className="text-xs text-[#a0a0a0]">
          {healthData.workers.filter((w) => w.status === "healthy").length} of{" "}
          {healthData.workers.length} workers healthy
        </div>
      </div>

      {/* Error Bursts */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="text-sm text-[#a0a0a0] mb-2">Error Bursts (15m)</div>
        <div className="text-3xl font-bold text-[#ededed] mb-1">{maxErrors}</div>
        <div className="text-xs text-[#a0a0a0]">
          Max errors across all workers
        </div>
      </div>

      {/* Average Failure Rate */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="text-sm text-[#a0a0a0] mb-2">Avg Failure Rate</div>
        <div className="text-3xl font-bold text-[#ededed] mb-1">
          {(avgFailureRate * 100).toFixed(2)}%
        </div>
        <div className="text-xs text-[#a0a0a0]">Across all workers</div>
      </div>

      {/* Last Update */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="text-sm text-[#a0a0a0] mb-2">Last Update</div>
        <div className="text-lg font-bold text-[#ededed] mb-1">
          {new Date(healthData.generatedAt).toLocaleTimeString()}
        </div>
        <div className="text-xs text-[#a0a0a0]">
          {new Date(healthData.generatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

