// apps/web/app/dashboard-exec/components/WorkerGrid.tsx

"use client";

import type { HealthSummaryResponse } from "@magnus-flipper-ai/core";
import { useState } from "react";
import { WorkerDetailCard } from "./WorkerDetailCard";

type Props = {
  data: HealthSummaryResponse;
};

const STATUS_INDICATORS: Record<string, { dot: string; label: string }> = {
  healthy: {
    dot: "bg-emerald-500",
    label: "Healthy",
  },
  degraded: {
    dot: "bg-amber-500",
    label: "Degraded",
  },
  unhealthy: {
    dot: "bg-red-500",
    label: "Unhealthy",
  },
};

export function WorkerGrid({ data }: Props) {
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {data.workers.map((worker) => {
        const status = STATUS_INDICATORS[worker.status] ?? STATUS_INDICATORS.healthy;
        const isSelected = selectedWorker === worker.worker;

        return (
          <div key={worker.worker}>
            <div
              className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 cursor-pointer hover:border-slate-600 transition-colors ${
                isSelected ? "border-slate-500" : ""
              }`}
              onClick={() => setSelectedWorker(isSelected ? null : worker.worker)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#ededed]">
                  {worker.worker}
                </h3>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${status.dot}`} />
                  <span className="text-sm text-[#a0a0a0]">{status.label}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#a0a0a0]">Last Heartbeat:</span>
                  <span className="text-[#ededed]">
                    {new Date(worker.lastHeartbeat).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a0a0a0]">Errors (15m):</span>
                  <span className="text-[#ededed]">{worker.errorCount15m}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a0a0a0]">Failure Rate:</span>
                  <span className="text-[#ededed]">
                    {(worker.failureRate * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              {isSelected && (
                <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                  <WorkerDetailCard worker={worker} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

