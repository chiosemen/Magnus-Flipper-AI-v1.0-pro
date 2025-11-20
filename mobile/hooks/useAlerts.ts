import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';

export function useAlerts(params?: {
  limit?: number;
  offset?: number;
  status?: 'pending' | 'sent' | 'failed';
}) {
  const setAlerts = useStore((state) => state.setAlerts);

  return useQuery({
    queryKey: ['alerts', params],
    queryFn: async () => {
      const data = await api.getAlerts(params);
      setAlerts(data);
      return data;
    },
  });
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();
  const markAsRead = useStore((state) => state.markAlertAsRead);

  return useMutation({
    mutationFn: (id: string) => api.markAlertAsRead(id),
    onSuccess: (_, id) => {
      markAsRead(id);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  const removeAlert = useStore((state) => state.removeAlert);

  return useMutation({
    mutationFn: (id: string) => api.deleteAlert(id),
    onSuccess: (_, id) => {
      removeAlert(id);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
