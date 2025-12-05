/**
 * GET /api/monitoring/worker-metrics?worker=worker-scraper|worker-tracker|worker-autosell
 * Returns time-series metrics for a specific worker
 */

import { NextResponse } from "next/server";
import type {
  WorkerMetricsResponse,
  WorkerName,
  TimeSeriesPoint,
} from "@magnus-flipper-ai/core";
import { createMockWorkerMetrics } from "@magnus-flipper-ai/core";
import { queryLogs, tableToObjects } from "@/lib/logAnalyticsClient";

// Fallback to mocks if explicitly set or if Azure is not configured
const USE_MOCK_DATA =
  process.env.USE_MOCK_MONITORING === "true" ||
  !process.env.AZURE_MONITOR_WORKSPACE_ID;

function buildWorkerMetricsKQL(worker: WorkerName): string {
  return `
let worker_name = "${worker}";
let window = 2h;
let binSize = 5m;
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(window)
| extend data = parse_json(Log_s)
| where data.worker == worker_name
| extend metricName = tostring(data.metricName)
| extend metricValue = todouble(data.value)
| where metricName in ("jobs_processed_total","jobs_failed_total","scrapes_per_minute","autosells_executed_total")
| summarize
    processed = sumif(metricValue, metricName == "jobs_processed_total"),
    failed = sumif(metricValue, metricName == "jobs_failed_total"),
    scrapes = sumif(metricValue, metricName == "scrapes_per_minute"),
    autosells = sumif(metricValue, metricName == "autosells_executed_total")
  by bin(TimeGenerated, binSize)
| extend failureRate = iff(processed > 0, todouble(failed) / todouble(processed), 0.0)
| order by TimeGenerated asc
| project TimeGenerated, processed, failed, failureRate, scrapes, autosells
`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const worker = searchParams.get("worker") as WorkerName | null;

    if (
      !worker ||
      !["worker-scraper", "worker-tracker", "worker-autosell"].includes(worker)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid worker parameter. Must be worker-scraper, worker-tracker, or worker-autosell",
        },
        { status: 400 }
      );
    }

    if (USE_MOCK_DATA) {
      const mockData = createMockWorkerMetrics(worker);
      return NextResponse.json(mockData);
    }

    // Query Azure Log Analytics
    const kql = buildWorkerMetricsKQL(worker);
    const tables = await queryLogs(kql, "PT2H");

    if (!tables.length || !tables[0].rows.length) {
      // No data found - return empty response
      const response: WorkerMetricsResponse = {
        worker,
        jobsProcessed: [],
        jobsFailed: [],
        failureRate: [],
      };
      return NextResponse.json(response);
    }

    const rows = tableToObjects(tables[0]);

    // Map KQL results to TimeSeriesPoint arrays
    const jobsProcessed: TimeSeriesPoint[] = [];
    const jobsFailed: TimeSeriesPoint[] = [];
    const failureRate: TimeSeriesPoint[] = [];
    const scrapesPerMinute: TimeSeriesPoint[] = [];
    const autosellsExecuted: TimeSeriesPoint[] = [];

    for (const row of rows) {
      const timestamp = row.TimeGenerated
        ? new Date(String(row.TimeGenerated)).toISOString()
        : new Date().toISOString();
      const processed = Number(row.processed || 0);
      const failed = Number(row.failed || 0);
      const rate = Number(row.failureRate || 0);
      const scrapes = Number(row.scrapes || 0);
      const autosells = Number(row.autosells || 0);

      jobsProcessed.push({ timestamp, value: processed });
      jobsFailed.push({ timestamp, value: failed });
      failureRate.push({ timestamp, value: rate });

      if (scrapes > 0) {
        scrapesPerMinute.push({ timestamp, value: scrapes });
      }

      if (autosells > 0) {
        autosellsExecuted.push({ timestamp, value: autosells });
      }
    }

    const response: WorkerMetricsResponse = {
      worker,
      jobsProcessed,
      jobsFailed,
      failureRate,
      ...(scrapesPerMinute.length > 0 && { scrapesPerMinute }),
      ...(autosellsExecuted.length > 0 && { autosellsExecuted }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching worker metrics:", error);

    // Fallback to mocks on error if in development
    if (process.env.NODE_ENV === "development") {
      const { searchParams } = new URL(request.url);
      const worker = searchParams.get("worker") as WorkerName | null;
      if (worker) {
        console.warn("Falling back to mock data due to error");
        const mockData = createMockWorkerMetrics(worker);
        return NextResponse.json(mockData);
      }
    }

    return NextResponse.json(
      {
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

