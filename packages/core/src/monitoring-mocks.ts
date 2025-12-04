// packages/core/src/monitoring-mocks.ts

import type {
  HealthSummaryResponse,
  WorkerMetricsResponse,
  SystemLoadResponse,
  SupabaseStatusResponse,
  WorkerName,
  TimeSeriesPoint,
} from "./monitoring-types.js";

function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString();
}

function buildSeries(
  points: number,
  stepMinutes: number,
  generator: (i: number) => number
): TimeSeriesPoint[] {
  const now = Date.now();
  const series: TimeSeriesPoint[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const ts = new Date(now - i * stepMinutes * 60_000).toISOString();
    series.push({ timestamp: ts, value: generator(points - 1 - i) });
  }
  return series;
}

// ---------- Health Summary Mock ----------

export function createMockHealthSummary(): HealthSummaryResponse {
  const workers = [
    {
      worker: "worker-scraper" as WorkerName,
      status: "healthy" as const,
      lastHeartbeat: minutesAgo(1),
      errorCount15m: 3,
      failureRate: 0.02,
    },
    {
      worker: "worker-tracker" as WorkerName,
      status: "degraded" as const,
      lastHeartbeat: minutesAgo(3),
      errorCount15m: 7,
      failureRate: 0.06,
    },
    {
      worker: "worker-autosell" as WorkerName,
      status: "healthy" as const,
      lastHeartbeat: minutesAgo(2),
      errorCount15m: 1,
      failureRate: 0.01,
    },
  ];

  const worst = workers.reduce<"healthy" | "degraded" | "unhealthy">(
    (acc, w) => {
      if (w.status === "unhealthy") return "unhealthy";
      if (w.status === "degraded" && acc === "healthy") return "degraded";
      return acc;
    },
    "healthy"
  );

  return {
    overallStatus: worst,
    workers,
    generatedAt: new Date().toISOString(),
  };
}

// ---------- Worker Metrics Mock ----------

export function createMockWorkerMetrics(
  worker: WorkerName
): WorkerMetricsResponse {
  const jobsProcessed = buildSeries(24, 5, (i) => 50 + 10 * Math.sin(i / 2));
  const jobsFailed = buildSeries(24, 5, (i) =>
    worker === "worker-autosell" ? 0.5 + 0.3 * Math.sin(i) : 1 + Math.cos(i)
  );

  const failureRate: TimeSeriesPoint[] = jobsProcessed.map((p, idx) => {
    const failures = jobsFailed[idx]?.value ?? 0;
    const rate = p.value > 0 ? failures / p.value : 0;
    return { timestamp: p.timestamp, value: Number(rate.toFixed(3)) };
  });

  const base: WorkerMetricsResponse = {
    worker,
    jobsProcessed,
    jobsFailed,
    failureRate,
  };

  if (worker === "worker-scraper") {
    base.scrapesPerMinute = buildSeries(24, 5, (i) => 5 + 2 * Math.sin(i / 3));
  }

  if (worker === "worker-autosell") {
    base.autosellsExecuted = buildSeries(24, 5, (i) => 3 + Math.sin(i / 4));
  }

  return base;
}

// ---------- System Load Mock ----------

export function createMockSystemLoad(): SystemLoadResponse {
  return {
    workers: [
      {
        worker: "worker-scraper",
        minReplicas: 1,
        maxReplicas: 5,
        currentReplicas: 2,
        cpuAverage: 42,
        memoryAverage: 65,
      },
      {
        worker: "worker-tracker",
        minReplicas: 1,
        maxReplicas: 3,
        currentReplicas: 1,
        cpuAverage: 35,
        memoryAverage: 48,
      },
      {
        worker: "worker-autosell",
        minReplicas: 1,
        maxReplicas: 2,
        currentReplicas: 1,
        cpuAverage: 50,
        memoryAverage: 55,
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}

// ---------- Supabase Status Mock ----------

export function createMockSupabaseStatus(
  healthy = true
): SupabaseStatusResponse {
  return {
    healthy,
    latencyMs: healthy ? 42 : undefined,
    lastChecked: new Date().toISOString(),
    errorMessage: healthy ? undefined : "Timeout connecting to Supabase",
  };
}

