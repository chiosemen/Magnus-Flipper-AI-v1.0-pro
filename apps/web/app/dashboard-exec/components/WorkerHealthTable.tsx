// apps/web/app/dashboard-exec/components/WorkerHealthTable.tsx

"use client";

import type { HealthSummaryResponse } from "@magnus-flipper-ai/core";

type Props = {
  data: HealthSummaryResponse;
};

export function WorkerHealthTable({ data }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Worker Health (Last 15 Minutes)
        </h2>
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-slate-900/80 text-slate-400">
          <tr>
            <th className="px-4 py-2 text-left">Worker</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-right">Errors (15m)</th>
            <th className="px-4 py-2 text-right">Failure Rate</th>
            <th className="px-4 py-2 text-left">Last Heartbeat</th>
          </tr>
        </thead>
        <tbody>
          {data.workers.map((w) => (
            <tr
              key={w.worker}
              className="border-t border-slate-800/80 hover:bg-slate-900/60"
            >
              <td className="px-4 py-2 font-medium text-slate-100">{w.worker}</td>
              <td className="px-4 py-2 text-slate-200">{w.status}</td>
              <td className="px-4 py-2 text-right text-slate-100">
                {w.errorCount15m}
              </td>
              <td className="px-4 py-2 text-right text-slate-100">
                {(w.failureRate * 100).toFixed(2)}%
              </td>
              <td className="px-4 py-2 text-slate-400">
                {new Date(w.lastHeartbeat).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

