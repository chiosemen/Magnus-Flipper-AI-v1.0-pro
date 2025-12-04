// apps/web/app/dashboard-exec/components/SupabaseCard.tsx

"use client";

import type { SupabaseStatusResponse } from "@magnus-flipper-ai/core";

type Props = {
  data: SupabaseStatusResponse;
};

export function SupabaseCard({ data }: Props) {
  const statusColor = data.healthy
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40"
    : "bg-red-500/10 text-red-400 border-red-500/40";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <h2 className="mb-4 text-sm font-semibold text-slate-100">
        Supabase Connectivity
      </h2>
      <div className={`rounded-lg border p-4 ${statusColor}`}>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-medium">
            {data.healthy ? "Connected" : "Disconnected"}
          </span>
          {data.latencyMs !== undefined && (
            <span className="text-xs opacity-80">{data.latencyMs}ms</span>
          )}
        </div>
        {data.errorMessage && (
          <div className="mt-2 text-xs opacity-80">{data.errorMessage}</div>
        )}
        <div className="mt-2 text-xs opacity-60">
          Last checked: {new Date(data.lastChecked).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

