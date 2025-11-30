/**
 * useCompetitorAnalysis Hook
 * Compare pricing across different marketplaces for similar items
 */

'use client';

import useSWR from 'swr';

export interface MarketplaceComparison {
  marketplace: string;
  totalListings: number;
  averagePrice: number;
  medianPrice: number;
  lowestPrice: number;
  highestPrice: number;
  priceRange: number;
  topDeals: Array<{
    id: string;
    externalId: string;
    title: string;
    price: number;
    url: string;
    imageUrl?: string;
    location?: string;
    condition?: string;
    postedAt?: string;
  }>;
  priceDistribution: {
    under50: number;
    '50to100': number;
    '100to200': number;
    '200to500': number;
    over500: number;
  };
}

interface UseCompetitorAnalysisOptions {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  days?: number;
}

interface UseCompetitorAnalysisReturn {
  comparison: MarketplaceComparison[];
  summary: {
    totalListings: number;
    marketplacesWithResults: number;
    cheapestMarketplace: MarketplaceComparison | null;
    mostExpensiveMarketplace: MarketplaceComparison | null;
    bestDeals: Array<{
      marketplace: string;
      title: string;
      price: number;
      url: string;
      imageUrl?: string;
      location?: string;
    }>;
  };
  loading: boolean;
  error: any;
  refresh: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCompetitorAnalysis(
  options: UseCompetitorAnalysisOptions
): UseCompetitorAnalysisReturn {
  const params = new URLSearchParams();
  if (options.query) params.set('query', options.query);
  if (options.category) params.set('category', options.category);
  if (options.minPrice) params.set('minPrice', options.minPrice.toString());
  if (options.maxPrice) params.set('maxPrice', options.maxPrice.toString());
  if (options.days) params.set('days', options.days.toString());

  const { data, error, isLoading, mutate } = useSWR(
    options.query || options.category
      ? `/api/analytics/competitor-analysis?${params.toString()}`
      : null,
    fetcher,
    {
      refreshInterval: 120000, // Refresh every 2 minutes
      revalidateOnFocus: true,
    }
  );

  return {
    comparison: data?.comparison || [],
    summary: data?.summary || {
      totalListings: 0,
      marketplacesWithResults: 0,
      cheapestMarketplace: null,
      mostExpensiveMarketplace: null,
      bestDeals: [],
    },
    loading: isLoading,
    error,
    refresh: mutate,
  };
}
