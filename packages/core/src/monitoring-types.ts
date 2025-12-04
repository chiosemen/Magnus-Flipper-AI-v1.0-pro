// packages/core/src/monitoring-types.ts

export type WorkerName =
  | "worker-scraper"
  | "worker-tracker"
  | "worker-autosell";

// ---------- Health Summary ----------

export interface WorkerHealthStatus {
  worker: WorkerName;
  status: "healthy" | "degraded" | "unhealthy";
  lastHeartbeat: string;        // ISO string
  errorCount15m: number;
  failureRate: number;          // 0–1
}

export interface HealthSummaryResponse {
  overallStatus: "healthy" | "degraded" | "unhealthy";
  workers: WorkerHealthStatus[];
  generatedAt: string;          // ISO string
}

// ---------- Worker Metrics ----------

export interface TimeSeriesPoint {
  timestamp: string;            // ISO string
  value: number;
}

export interface WorkerMetricsResponse {
  worker: WorkerName;
  jobsProcessed: TimeSeriesPoint[];
  jobsFailed: TimeSeriesPoint[];
  failureRate: TimeSeriesPoint[];
  scrapesPerMinute?: TimeSeriesPoint[];      // scraper-only
  autosellsExecuted?: TimeSeriesPoint[];     // autosell-only
}

// ---------- System Load ----------

export interface WorkerScaleStatus {
  worker: WorkerName;
  minReplicas: number;
  maxReplicas: number;
  currentReplicas: number;
  cpuAverage?: number;
  memoryAverage?: number;
}

export interface SystemLoadResponse {
  workers: WorkerScaleStatus[];
  generatedAt: string;
}

// ---------- Supabase Status ----------

export interface SupabaseStatusResponse {
  healthy: boolean;
  latencyMs?: number;
  lastChecked: string;
  errorMessage?: string;
}

