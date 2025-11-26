"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type SavedSearchPayload } from "@/lib/api";

export function useSavedSearches() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["saved-searches"],
    queryFn: api.savedSearches.list,
    staleTime: 10_000,
    retry: false,
  });

  const create = useMutation({
    mutationFn: (payload: SavedSearchPayload) => api.savedSearches.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-searches"] }),
  });

  return {
    searches: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    create,
  };
}
