import { useQuery } from '@tanstack/react-query';
import { magnusClient } from '@/lib/magnusClient';

export function useMarketData() {
  const {
    data: insights,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['marketInsights'],
    queryFn: async () => {
      const response = await magnusClient.getMarketInsights();
      return response.insights;
    },
  });

  return {
    insights: insights || [],
    isLoading,
    error,
    refetch,
  };
}
