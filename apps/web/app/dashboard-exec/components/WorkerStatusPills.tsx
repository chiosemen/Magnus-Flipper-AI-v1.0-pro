// apps/web/app/dashboard-exec/components/WorkerStatusPills.tsx

"use client";

import type { HealthSummaryResponse } from "@magnus-flipper-ai/core";

type Props = {
  data: HealthSummaryResponse;
};

const STATUS_COLORS: Record<string, string> = {
  healthy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/40",
  degraded: "bg-amber-500/10 text-amber-400 border-amber-500/40",
  unhealthy: "bg-red-500/10 text-red-400 border-red-500/40",
};

export function WorkerStatusPills({ data }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {data.workers.map((w) => {
        const color =
          STATUS_COLORS[w.status] ?? "bg-slate-500/10 text-slate-300 border-slate-500/40";

        return (
          <div
            key={w.worker}
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${color}`}
          >
            <span className="font-medium">{w.worker}</span>
            <span className="text-xs opacity-80">
              {w.status.toUpperCase()} · {Math.round(w.failureRate * 100)}% fail ·{" "}
              {w.errorCount15m} errs/15m
            </span>
          </div>
        );
      })}
    </div>
  );
}

