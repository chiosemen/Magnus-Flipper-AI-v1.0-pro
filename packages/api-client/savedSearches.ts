import { FetchClient } from "./fetchClient";
import { SavedSearchArraySchema, SavedSearchSchema } from "./validators";
import { SavedSearch, SavedSearchCreateRequest, SavedSearchListResponse, SavedSearchUpdateRequest } from "./types";

export function createSavedSearchesApi(fetcher: FetchClient) {
  return {
    list: async (signal?: AbortSignal): Promise<SavedSearchListResponse> => {
      const data = await fetcher<unknown>("/api/saved-searches", { signal });
      return SavedSearchArraySchema.parse(data);
    },
    create: async (payload: SavedSearchCreateRequest, signal?: AbortSignal): Promise<SavedSearch> => {
      const data = await fetcher<unknown>("/api/saved-searches", {
        method: "POST",
        body: JSON.stringify(payload),
        signal,
      });
      return SavedSearchSchema.parse(data);
    },
    getById: async (id: string, signal?: AbortSignal): Promise<SavedSearch> => {
      const data = await fetcher<unknown>(`/api/saved-searches/${encodeURIComponent(id)}`, { signal });
      return SavedSearchSchema.parse(data);
    },
    update: async (id: string, payload: SavedSearchUpdateRequest, signal?: AbortSignal): Promise<SavedSearch> => {
      const data = await fetcher<unknown>(`/api/saved-searches/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        signal,
      });
      return SavedSearchSchema.parse(data);
    },
    remove: async (id: string, signal?: AbortSignal): Promise<void> => {
      await fetcher<void>(`/api/saved-searches/${encodeURIComponent(id)}`, {
        method: "DELETE",
        signal,
      });
    },
  };
}

export type SavedSearchesApi = ReturnType<typeof createSavedSearchesApi>;
