// apps/web/lib/logAnalyticsClient.ts

import { DefaultAzureCredential, ClientSecretCredential } from "@azure/identity";
import {
  LogsQueryClient,
  LogsQueryResult,
  LogsTable,
} from "@azure/monitor-query";

const workspaceId = process.env.AZURE_MONITOR_WORKSPACE_ID;

if (!workspaceId) {
  console.warn(
    "AZURE_MONITOR_WORKSPACE_ID is not set. Azure Log Analytics queries will not work."
  );
}

function createCredential() {
  const tenantId = process.env.AZURE_MONITOR_TENANT_ID;
  const clientId = process.env.AZURE_MONITOR_CLIENT_ID;
  const clientSecret = process.env.AZURE_MONITOR_CLIENT_SECRET;

  if (tenantId && clientId && clientSecret) {
    return new ClientSecretCredential(tenantId, clientId, clientSecret);
  }

  // Fallback for local dev if DefaultAzureCredential is configured (Azure CLI)
  return new DefaultAzureCredential();
}

const credential = createCredential();
const logsClient = new LogsQueryClient(credential);

export type TimeRange =
  | "PT15M"
  | "PT1H"
  | "PT6H"
  | "PT24H"
  | "P1D"
  | "P7D"
  | "P30D";

/**
 * Query Azure Log Analytics workspace
 * @param kql - KQL query string
 * @param timespan - ISO8601 duration string (e.g., "PT15M" for 15 minutes)
 * @returns Array of LogsTable results
 */
export async function queryLogs(
  kql: string,
  timespan: TimeRange = "PT15M"
): Promise<LogsTable[]> {
  if (!workspaceId) {
    throw new Error("AZURE_MONITOR_WORKSPACE_ID is not set");
  }

  const result = await logsClient.queryWorkspace(workspaceId, kql, {
    timespan: { duration: timespan },
  });

  // Handle both LogsQueryResult and LogsQueryPartialResult
  if (result.status === "Partial" || result.status === "Success") {
    if (!result.tables || result.tables.length === 0) {
      return [];
    }
    return result.tables;
  }

  return [];
}

/**
 * Helper to convert a LogsTable into plain JS objects
 * @param table - LogsTable from Azure Monitor Query
 * @returns Array of objects with column names as keys
 */
export function tableToObjects(table: LogsTable): Record<string, unknown>[] {
  const columns = table.columnDescriptors.map((c) => c.name);
  return table.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    row.forEach((value, idx) => {
      const colName = columns[idx];
      if (colName) {
        obj[colName] = value;
      }
    });
    return obj;
  });
}

