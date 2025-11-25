/**
 * useSavedSearches - React Query hooks for saved searches CRUD
 * Uses @magnus-flipper-ai/core types
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  SavedSearch,
  CreateSavedSearchRequest,
  UpdateSavedSearchRequest,
} from '@magnus-flipper-ai/core';

export function useSavedSearches() {
  const queryClient = useQueryClient();

  const listQuery = useQuery<SavedSearch[]>({
    queryKey: ['saved-searches'],
    queryFn: () => api.getSavedSearches(),
    staleTime: 60000, // 1 minute
  });

  const create = useMutation<SavedSearch, Error, CreateSavedSearchRequest>({
    mutationFn: (payload) => api.createSavedSearch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  const update = useMutation<
    SavedSearch,
    Error,
    { id: string; payload: UpdateSavedSearchRequest }
  >({
    mutationFn: ({ id, payload }) => api.updateSavedSearch(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  const remove = useMutation<void, Error, string>({
    mutationFn: (id) => api.deleteSavedSearch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });

  return {
    ...listQuery,
    create,
    update,
    remove,
  };
}
