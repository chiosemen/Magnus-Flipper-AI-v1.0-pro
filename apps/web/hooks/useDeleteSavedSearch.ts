import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@magnus-flipper-ai/api-client';

const QUERY_KEY = ['saved-searches'];

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: (id) => apiClient.savedSearches.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
