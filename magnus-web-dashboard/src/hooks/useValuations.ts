import { useMutation } from '@tanstack/react-query';
import { magnusClient } from '@/lib/magnusClient';

export function useValuations() {
  const {
    mutate: getValuation,
    data: valuation,
    isPending: isLoading,
    error,
  } = useMutation({
    mutationFn: async (data: { productId?: string; productData?: any }) => {
      const response = await magnusClient.getAIValuation(
        data.productId,
        data.productData
      );
      return response.valuation;
    },
  });

  return {
    getValuation,
    valuation,
    isLoading,
    error,
  };
}
