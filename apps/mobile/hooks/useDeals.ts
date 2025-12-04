import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';

export function useDeals(params?: {
  limit?: number;
  offset?: number;
  minScore?: number;
  category?: string;
}) {
  const setDeals = useStore((state) => state.setDeals);

  return useQuery({
    queryKey: ['deals', params],
    queryFn: async () => {
      const data = await api.getDeals(params);
      setDeals(data);
      return data;
    },
    staleTime: 60000, // 1 minute
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ['deal', id],
    queryFn: () => api.getDeal(id),
    enabled: !!id,
  });
}
