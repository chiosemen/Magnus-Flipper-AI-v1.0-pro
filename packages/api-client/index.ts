import { createAlertsApi } from "./alerts";
import { createFetchClient, FetchClient, FetchClientConfig } from "./fetchClient";
import { createListingsApi } from "./listings";
import { createSavedSearchesApi } from "./savedSearches";
import { BillingStatus } from "./types";
import { BillingStatusSchema } from "./validators";

export function createApiClient(config: FetchClientConfig = {}) {
  const fetcher: FetchClient = createFetchClient(config);

  const savedSearches = createSavedSearchesApi(fetcher);
  const listings = createListingsApi(fetcher);
  const alerts = createAlertsApi(fetcher);
  const billing = {
    status: async (signal?: AbortSignal): Promise<BillingStatus> => {
      const data = await fetcher<unknown>("/api/billing/status", { signal });
      return BillingStatusSchema.parse(data);
    },
  };
  const health = async (signal?: AbortSignal): Promise<unknown> => fetcher("/health", { signal });

  return {
    fetch: fetcher,
    savedSearches,
    listings,
    alerts,
    billing,
    health,
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
export const apiClient = createApiClient();

export * from "./types";
export * from "./validators";
export * from "./fetchClient";
export * from "./savedSearches";
export * from "./listings";
export * from "./alerts";
