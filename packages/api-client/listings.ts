import { FetchClient } from "./fetchClient";
import { Listing, ListingsFeedParams } from "./types";
import { ListingArraySchema, ListingSchema } from "./validators";

export function createListingsApi(fetcher: FetchClient) {
  return {
    feed: async (params: ListingsFeedParams = {}, signal?: AbortSignal): Promise<Listing[]> => {
      const query = new URLSearchParams();
      if (params.page != null) query.set("page", String(params.page));
      if (params.limit != null) query.set("limit", String(params.limit));

      const path = query.toString() ? `/api/listings/feed?${query.toString()}` : "/api/listings/feed";
      const data = await fetcher<unknown>(path, { signal });
      return ListingArraySchema.parse(data);
    },
    getById: async (id: string, signal?: AbortSignal): Promise<Listing> => {
      const data = await fetcher<unknown>(`/api/listings/${encodeURIComponent(id)}`, { signal });
      return ListingSchema.parse(data);
    },
  };
}

export type ListingsApi = ReturnType<typeof createListingsApi>;
