import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useAlertsFeed() {
  const recent = useQuery({
    queryKey: ['alerts', 'recent'],
    queryFn: () => api.getRecentAlerts(),
  });

  const stats = useQuery({
    queryKey: ['alerts', 'stats'],
    queryFn: () => api.getAlertsStats(),
  });

  return { recent, stats };
}
