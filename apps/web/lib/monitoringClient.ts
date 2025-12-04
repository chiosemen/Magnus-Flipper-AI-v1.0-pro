// apps/web/lib/monitoringClient.ts

import type {
  HealthSummaryResponse,
  WorkerMetricsResponse,
  SystemLoadResponse,
  SupabaseStatusResponse,
  WorkerName,
} from "@magnus-flipper-ai/core";

const BASE = "/api/monitoring";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Monitoring API error on ${path}: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export function fetchHealthSummary(): Promise<HealthSummaryResponse> {
  return getJSON<HealthSummaryResponse>("/health-summary");
}

export function fetchWorkerMetrics(worker: WorkerName): Promise<WorkerMetricsResponse> {
  return getJSON<WorkerMetricsResponse>(`/worker-metrics?worker=${worker}`);
}

export function fetchSystemLoad(): Promise<SystemLoadResponse> {
  return getJSON<SystemLoadResponse>("/system-load");
}

export function fetchSupabaseStatus(): Promise<SupabaseStatusResponse> {
  return getJSON<SupabaseStatusResponse>("/supabase-status");
}

