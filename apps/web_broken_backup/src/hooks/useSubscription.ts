import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { magnusClient } from '@/lib/magnusClient';

export function useSubscription() {
  const { subscription, setSubscription } = useAuthStore();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const data = await magnusClient.getUserSubscription();
      if (data) {
        setSubscription(data);
      }
      return data;
    },
  });

  return {
    subscription: subscription || data,
    isLoading,
    error,
    refetch,
  };
}
