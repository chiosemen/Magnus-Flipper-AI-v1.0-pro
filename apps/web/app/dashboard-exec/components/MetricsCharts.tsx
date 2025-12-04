// apps/web/app/dashboard-exec/components/MetricsCharts.tsx

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { WorkerMetricsResponse } from "@magnus-flipper-ai/core";

type Props = {
  metrics: WorkerMetricsResponse;
};

export function MetricsCharts({ metrics }: Props) {
  const data = metrics.jobsProcessed.map((p, idx) => ({
    time: new Date(p.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    processed: p.value,
    failed: metrics.jobsFailed[idx]?.value ?? 0,
    failureRate: (metrics.failureRate[idx]?.value ?? 0) * 100,
    scrapesPerMinute: metrics.scrapesPerMinute?.[idx]?.value,
    autosellsExecuted: metrics.autosellsExecuted?.[idx]?.value,
  }));

  return (
    <div className="h-80 w-full rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">
          {metrics.worker} — Jobs / Failure Rate
        </h2>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="time" stroke="#9ca3af" />
          <YAxis yAxisId="left" stroke="#9ca3af" />
          <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="processed"
            stroke="#4ade80"
            name="Jobs Processed"
            dot={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="failed"
            stroke="#f97316"
            name="Jobs Failed"
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="failureRate"
            stroke="#f87171"
            name="Failure Rate %"
            dot={false}
          />
          {metrics.scrapesPerMinute && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="scrapesPerMinute"
              stroke="#60a5fa"
              name="Scrapes/Min"
              dot={false}
            />
          )}
          {metrics.autosellsExecuted && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="autosellsExecuted"
              stroke="#a78bfa"
              name="Autosells"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

