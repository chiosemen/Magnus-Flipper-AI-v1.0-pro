// apps/web/app/dashboard-exec/components/LoadPanel.tsx

"use client";

import type { SystemLoadResponse } from "@magnus-flipper-ai/core";

type Props = {
  data: SystemLoadResponse;
};

export function LoadPanel({ data }: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <h2 className="mb-4 text-sm font-semibold text-slate-100">
        System Load & Scaling
      </h2>
      <div className="space-y-4">
        {data.workers.map((worker) => {
          const replicaPercent = (worker.currentReplicas / worker.maxReplicas) * 100;
          const scalingStatus =
            replicaPercent > 80
              ? "Near Max"
              : replicaPercent > 50
              ? "Scaling OK"
              : "Low Load";

          return (
            <div
              key={worker.worker}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium text-slate-100">{worker.worker}</h3>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    scalingStatus === "Near Max"
                      ? "bg-amber-500/20 text-amber-400"
                      : scalingStatus === "Scaling OK"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-500/20 text-slate-400"
                  }`}
                >
                  {scalingStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Replicas</div>
                  <div className="text-slate-100">
                    {worker.currentReplicas} / {worker.maxReplicas} (min: {worker.minReplicas})
                  </div>
                </div>
                {worker.cpuAverage !== undefined && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1">CPU</div>
                    <div className="text-slate-100">{worker.cpuAverage.toFixed(1)}%</div>
                  </div>
                )}
                {worker.memoryAverage !== undefined && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Memory</div>
                    <div className="text-slate-100">{worker.memoryAverage.toFixed(1)}%</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

