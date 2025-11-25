import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type SavedSearch, type SavedSearchCreateRequest } from '@magnus-flipper-ai/api-client';

const QUERY_KEY = ['saved-searches'];

export function useCreateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation<SavedSearch, unknown, SavedSearchCreateRequest>({
    mutationFn: (payload) => apiClient.savedSearches.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
