import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';

export function useWatchlists() {
  const setWatchlists = useStore((state) => state.setWatchlists);

  return useQuery({
    queryKey: ['watchlists'],
    queryFn: async () => {
      const data = await api.getWatchlists();
      setWatchlists(data);
      return data;
    },
  });
}

export function useCreateWatchlist() {
  const queryClient = useQueryClient();
  const addWatchlist = useStore((state) => state.addWatchlist);

  return useMutation({
    mutationFn: (watchlist: {
      name: string;
      keywords: string[];
      minPrice?: number;
      maxPrice?: number;
      minScore?: number;
      categories?: string[];
    }) => api.createWatchlist(watchlist),
    onSuccess: (data) => {
      addWatchlist(data);
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
    },
  });
}

export function useUpdateWatchlist() {
  const queryClient = useQueryClient();
  const updateWatchlist = useStore((state) => state.updateWatchlist);

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      api.updateWatchlist(id, updates),
    onSuccess: (data, variables) => {
      updateWatchlist(variables.id, data);
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
    },
  });
}

export function useDeleteWatchlist() {
  const queryClient = useQueryClient();
  const removeWatchlist = useStore((state) => state.removeWatchlist);

  return useMutation({
    mutationFn: (id: string) => api.deleteWatchlist(id),
    onSuccess: (_, id) => {
      removeWatchlist(id);
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
    },
  });
}
