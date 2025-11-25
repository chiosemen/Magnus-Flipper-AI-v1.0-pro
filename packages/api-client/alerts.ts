import { FetchClient } from "./fetchClient";
import { AlertRecord, AlertsStats } from "./types";
import { AlertRecordArraySchema, AlertsStatsSchema } from "./validators";

export function createAlertsApi(fetcher: FetchClient) {
  return {
    recent: async (signal?: AbortSignal): Promise<AlertRecord[]> => {
      const data = await fetcher<unknown>("/api/alerts/recent", { signal });
      return AlertRecordArraySchema.parse(data);
    },
    stats: async (signal?: AbortSignal): Promise<AlertsStats> => {
      const data = await fetcher<unknown>("/api/alerts/stats", { signal });
      return AlertsStatsSchema.parse(data);
    },
  };
}

export type AlertsApi = ReturnType<typeof createAlertsApi>;
