import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, type SavedSearch, type SavedSearchCreateRequest, type SavedSearchUpdateRequest } from '@magnus-flipper-ai/api-client';

const QUERY_KEY = ['saved-searches'];

export function useSavedSearches() {
  const queryClient = useQueryClient();

  const query = useQuery<SavedSearch[]>({
    queryKey: QUERY_KEY,
    queryFn: () => apiClient.savedSearches.list(),
    staleTime: 60_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const create = async (payload: SavedSearchCreateRequest) => {
    const created = await apiClient.savedSearches.create(payload);
    await invalidate();
    return created;
  };

  const update = async (id: string, payload: SavedSearchUpdateRequest) => {
    const updated = await apiClient.savedSearches.update(id, payload);
    await invalidate();
    return updated;
  };

  const remove = async (id: string) => {
    await apiClient.savedSearches.remove(id);
    await invalidate();
  };

  return {
    ...query,
    searches: query.data ?? [],
    create,
    update,
    remove,
    refresh: invalidate,
  };
}
