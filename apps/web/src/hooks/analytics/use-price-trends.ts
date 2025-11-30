/**
 * usePriceTrends Hook
 * Fetch and track price trends across marketplaces
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';

export interface PriceTrend {
  marketplace: string;
  externalId: string;
  title: string;
  url: string;
  imageUrl?: string;
  location?: string;
  priceHistory: Array<{
    price: number;
    priceChange: number | null;
    priceChangePercent: number | null;
    recordedAt: string;
  }>;
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  totalPriceChange: number;
  totalPriceChangePercent: number;
  priceChangesCount: number;
  averagePrice: number;
  volatility: number;
  lastUpdated: string;
}

interface UsePriceTrendsOptions {
  marketplace?: string;
  externalId?: string;
  days?: number;
  minPriceChange?: number;
  sortBy?: 'biggest_drop' | 'biggest_increase' | 'most_volatile' | 'recent';
  limit?: number;
}

interface UsePriceTrendsReturn {
  trends: PriceTrend[];
  summary: {
    totalListingsTracked: number;
    totalListingsWithChanges: number;
    averagePriceChange: number;
    biggestDrop?: PriceTrend;
    biggestIncrease?: PriceTrend;
    mostVolatile?: PriceTrend;
  };
  loading: boolean;
  error: any;
  refresh: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function usePriceTrends(options: UsePriceTrendsOptions = {}): UsePriceTrendsReturn {
  const params = new URLSearchParams();
  if (options.marketplace) params.set('marketplace', options.marketplace);
  if (options.externalId) params.set('externalId', options.externalId);
  if (options.days) params.set('days', options.days.toString());
  if (options.minPriceChange) params.set('minPriceChange', options.minPriceChange.toString());
  if (options.sortBy) params.set('sortBy', options.sortBy);
  if (options.limit) params.set('limit', options.limit.toString());

  const { data, error, isLoading, mutate } = useSWR(
    `/api/analytics/price-trends?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  return {
    trends: data?.trends || [],
    summary: data?.summary || {
      totalListingsTracked: 0,
      totalListingsWithChanges: 0,
      averagePriceChange: 0,
    },
    loading: isLoading,
    error,
    refresh: mutate,
  };
}
