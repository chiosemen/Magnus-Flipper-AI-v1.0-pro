import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useSavedSearches() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => api.getSavedSearches(),
  });

  const create = useMutation({
    mutationFn: (payload: any) => api.createSavedSearch(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      api.updateSavedSearch(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteSavedSearch(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  return {
    ...listQuery,
    create,
    update,
    remove,
  };
}
