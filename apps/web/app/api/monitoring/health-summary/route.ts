/**
 * GET /api/monitoring/health-summary
 * Returns overall health status for all workers
 */

import { NextResponse } from "next/server";
import type {
  HealthSummaryResponse,
  WorkerHealthStatus,
  WorkerName,
} from "@magnus-flipper-ai/core";
import { createMockHealthSummary } from "@magnus-flipper-ai/core";
import { queryLogs, tableToObjects } from "@/lib/logAnalyticsClient";

// Fallback to mocks if explicitly set or if Azure is not configured
const USE_MOCK_DATA =
  process.env.USE_MOCK_MONITORING === "true" ||
  !process.env.AZURE_MONITOR_WORKSPACE_ID;

const HEALTH_SUMMARY_KQL = `
let health_window = 15m;
let error_window = 15m;
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(health_window)
| extend data = parse_json(Log_s)
| where isnotempty(data.worker)
| where data.worker in ("worker-scraper", "worker-tracker", "worker-autosell")
| extend level = tostring(data.level)
| extend metricName = tostring(data.metricName)
| extend metricValue = todouble(data.value)
| summarize
    lastHeartbeat = max(TimeGenerated),
    errorCount15m = countif(level == "error"),
    processed = sumif(metricValue, metricName == "jobs_processed_total"),
    failed = sumif(metricValue, metricName == "jobs_failed_total")
  by worker = tostring(data.worker)
| extend failureRate = iff(processed > 0, todouble(failed) / todouble(processed), 0.0)
| extend status = case(
    errorCount15m > 20, "degraded",
    failureRate > 0.1, "degraded",
    isnull(lastHeartbeat), "unhealthy",
    "healthy"
  )
| project worker, status, lastHeartbeat, errorCount15m, failureRate
`;

export async function GET() {
  try {
    if (USE_MOCK_DATA) {
      const mockData = createMockHealthSummary();
      return NextResponse.json(mockData);
    }

    // Query Azure Log Analytics
    const tables = await queryLogs(HEALTH_SUMMARY_KQL, "PT15M");

    if (!tables.length || !tables[0].rows.length) {
      // No data found - return empty response or fallback to mocks
      const response: HealthSummaryResponse = {
        overallStatus: "healthy",
        workers: [],
        generatedAt: new Date().toISOString(),
      };
      return NextResponse.json(response);
    }

    const rows = tableToObjects(tables[0]);

    // Map KQL results to WorkerHealthStatus
    const workers: WorkerHealthStatus[] = rows.map((row: Record<string, unknown>) => {
      const worker = String(row.worker || "") as WorkerName;
      const status = String(row.status || "healthy") as
        | "healthy"
        | "degraded"
        | "unhealthy";
      const lastHeartbeat = row.lastHeartbeat
        ? new Date(String(row.lastHeartbeat)).toISOString()
        : new Date().toISOString();
      const errorCount15m = Number(row.errorCount15m || 0);
      const failureRate = Number(row.failureRate || 0);

      return {
        worker,
        status,
        lastHeartbeat,
        errorCount15m,
        failureRate,
      };
    });

    // Derive overall status from worst worker status
    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
    for (const w of workers) {
      if (w.status === "unhealthy") {
        overallStatus = "unhealthy";
        break;
      }
      if (w.status === "degraded" && overallStatus === "healthy") {
        overallStatus = "degraded";
      }
    }

    const response: HealthSummaryResponse = {
      overallStatus,
      workers,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching health summary:", error);

    // Fallback to mocks on error if in development
    if (process.env.NODE_ENV !== "production") {
      console.warn("Falling back to mock data due to error");
      const mockData = createMockHealthSummary();
      return NextResponse.json(mockData);
    }

    return NextResponse.json(
      {
        overallStatus: "unhealthy",
        workers: [],
        generatedAt: new Date().toISOString(),
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : "Failed to query Azure Log Analytics",
      },
      { status: 500 }
    );
  }
}

