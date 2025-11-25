import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type SavedSearch, type SavedSearchUpdateRequest } from '@magnus-flipper-ai/api-client';

const QUERY_KEY = ['saved-searches'];

export function useUpdateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation<SavedSearch, unknown, { id: string; payload: SavedSearchUpdateRequest }>({
    mutationFn: ({ id, payload }) => apiClient.savedSearches.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
