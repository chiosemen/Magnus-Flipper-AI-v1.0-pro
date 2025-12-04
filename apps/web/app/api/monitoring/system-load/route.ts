/**
 * GET /api/monitoring/system-load
 * Returns scaling and load information for all workers
 */

import { NextResponse } from "next/server";
import type { SystemLoadResponse } from "@magnus-flipper-ai/core";
import { createMockSystemLoad } from "@magnus-flipper-ai/core";

// TODO: Replace with real Azure Metrics queries
const USE_MOCK_DATA = process.env.NODE_ENV === "development" || !process.env.AZURE_LOG_ANALYTICS_WORKSPACE_ID;

export async function GET() {
  try {
    if (USE_MOCK_DATA) {
      const mockData = createMockSystemLoad();
      return NextResponse.json(mockData);
    }

    // TODO: Implement real Azure Metrics query
    // KQL query from Phase 12R blueprint:
    // AzureMetrics
    // | where TimeGenerated > ago(30m)
    // | where ResourceGroup == "magnus-rg"
    // | where Namespace == "microsoft.app/containerapps"
    // | where MetricName in ("CpuUsage","MemoryUsage","ReplicaCount")
    // | summarize cpuAverage = avgif(Val, MetricName == "CpuUsage"), ...
    //   by bin(TimeGenerated, 10m), Resource, MetricName, AppName = tostring(Tags["appName"])
    // ... (see PHASE_12R_ALERTING_BLUEPRINT.md for full query)

    // Placeholder for real implementation
    const response: SystemLoadResponse = {
      workers: [],
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching system load:", error);
    return NextResponse.json(
      {
        workers: [],
        generatedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

