/**
 * GET /api/monitoring/system-load
 * Returns scaling and load information for all workers
 */

import { NextResponse } from "next/server";
import type {
  SystemLoadResponse,
  WorkerScaleStatus,
  WorkerName,
} from "@magnus-flipper-ai/core";
import { createMockSystemLoad } from "@magnus-flipper-ai/core";
import { queryLogs, tableToObjects } from "@/lib/logAnalyticsClient";

// Fallback to mocks if explicitly set or if Azure is not configured
const USE_MOCK_DATA =
  process.env.USE_MOCK_MONITORING === "true" ||
  !process.env.AZURE_MONITOR_WORKSPACE_ID;

// Scale rules from Phase 12S (hardcoded for now, can be fetched from Container Apps API if needed)
const SCALE_RULES: Record<
  WorkerName,
  { minReplicas: number; maxReplicas: number }
> = {
  "worker-scraper": { minReplicas: 1, maxReplicas: 5 },
  "worker-tracker": { minReplicas: 1, maxReplicas: 3 },
  "worker-autosell": { minReplicas: 1, maxReplicas: 2 },
};

const SYSTEM_LOAD_KQL = `
AzureMetrics
| where TimeGenerated > ago(30m)
| where ResourceGroup == "magnus-rg"
| where Namespace == "microsoft.app/containerapps"
| where MetricName in ("CpuUsage","MemoryUsage","ReplicaCount")
| extend AppName = tostring(Tags["appName"])
| where AppName in ("worker-scraper","worker-tracker","worker-autosell")
| summarize
    cpuAverage = avgif(Val, MetricName == "CpuUsage"),
    memoryAverage = avgif(Val, MetricName == "MemoryUsage"),
    currentReplicas = avgif(Val, MetricName == "ReplicaCount")
  by AppName
| project AppName, cpuAverage, memoryAverage, currentReplicas
`;

export async function GET() {
  try {
    if (USE_MOCK_DATA) {
      const mockData = createMockSystemLoad();
      return NextResponse.json(mockData);
    }

    // Query Azure Metrics
    const tables = await queryLogs(SYSTEM_LOAD_KQL, "PT30M");

    if (!tables.length || !tables[0].rows.length) {
      // No data found - return empty response or fallback to mocks
      const response: SystemLoadResponse = {
        workers: [],
        generatedAt: new Date().toISOString(),
      };
      return NextResponse.json(response);
    }

    const rows = tableToObjects(tables[0]);

    // Map KQL results to WorkerScaleStatus
    const workers: WorkerScaleStatus[] = rows
      .map((row: Record<string, unknown>) => {
        const appName = String(row.AppName || "");
        const worker = appName as WorkerName;

        // Skip if not a valid worker name
        if (!["worker-scraper", "worker-tracker", "worker-autosell"].includes(worker)) {
          return null;
        }

        const scaleRule = SCALE_RULES[worker];
        const cpuAverage = row.cpuAverage ? Number(row.cpuAverage) : undefined;
        const memoryAverage = row.memoryAverage
          ? Number(row.memoryAverage)
          : undefined;
        const currentReplicas = row.currentReplicas
          ? Math.round(Number(row.currentReplicas))
          : scaleRule.minReplicas;

        return {
          worker,
          minReplicas: scaleRule.minReplicas,
          maxReplicas: scaleRule.maxReplicas,
          currentReplicas,
          cpuAverage,
          memoryAverage,
        };
      })
      .filter((w): w is WorkerScaleStatus => w !== null);

    const response: SystemLoadResponse = {
      workers,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching system load:", error);

    // Fallback to mocks on error if in development
    const isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
    if (isDevelopment) {
      console.warn("Falling back to mock data due to error");
      const mockData = createMockSystemLoad();
      return NextResponse.json(mockData);
    }

    return NextResponse.json(
      {
        workers: [],
        generatedAt: new Date().toISOString(),
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : "Failed to query Azure Metrics",
      },
      { status: 500 }
    );
  }
}

