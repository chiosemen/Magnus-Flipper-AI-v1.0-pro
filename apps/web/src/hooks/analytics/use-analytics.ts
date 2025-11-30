/**
 * Combined Analytics Hooks
 * useConversionMetrics and useSearchPerformance
 */

'use client';

import useSWR from 'swr';

// ============================================================================
// CONVERSION METRICS
// ============================================================================

export interface ConversionAnalysis {
  group: string;
  marketplace: string;
  savedSearch?: any;
  metrics: {
    views: number;
    clicks: number;
    favorites: number;
    contacts: number;
    purchases: number;
    totalActions: number;
  };
  uniqueListings: number;
  uniqueUsers: number;
  conversionFunnel: {
    clickThroughRate: number;
    favoriteRate: number;
    contactRate: number;
    conversionRate: number;
    overallConversionRate: number;
  };
  engagement: {
    avgActionsPerListing: number;
    avgActionsPerUser: number;
  };
}

interface UseConversionMetricsOptions {
  marketplace?: string;
  savedSearchId?: string;
  userId?: string;
  days?: number;
  groupBy?: 'marketplace' | 'search';
}

interface UseConversionMetricsReturn {
  analysis: ConversionAnalysis[];
  summary: {
    totalActions: number;
    totalViews: number;
    totalClicks: number;
    totalFavorites: number;
    totalContacts: number;
    totalPurchases: number;
    bestPerformingMarketplace: ConversionAnalysis | null;
    worstPerformingMarketplace: ConversionAnalysis | null;
  };
  loading: boolean;
  error: any;
  refresh: () => void;
  trackAction: (action: {
    userId: string;
    listingId?: string;
    savedSearchId?: string;
    marketplace: string;
    actionType: 'VIEW' | 'CLICK' | 'FAVORITE' | 'CONTACT' | 'PURCHASE';
    metadata?: any;
  }) => Promise<void>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useConversionMetrics(
  options: UseConversionMetricsOptions = {}
): UseConversionMetricsReturn {
  const params = new URLSearchParams();
  if (options.marketplace) params.set('marketplace', options.marketplace);
  if (options.savedSearchId) params.set('savedSearchId', options.savedSearchId);
  if (options.userId) params.set('userId', options.userId);
  if (options.days) params.set('days', options.days.toString());
  if (options.groupBy) params.set('groupBy', options.groupBy);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/analytics/conversion-metrics?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  const trackAction = async (action: any) => {
    try {
      const response = await fetch('/api/analytics/conversion-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });

      if (!response.ok) {
        throw new Error('Failed to track action');
      }

      // Refresh the data after tracking
      mutate();
    } catch (error) {
      console.error('[Conversion Metrics] Failed to track action:', error);
    }
  };

  return {
    analysis: data?.analysis || [],
    summary: data?.summary || {
      totalActions: 0,
      totalViews: 0,
      totalClicks: 0,
      totalFavorites: 0,
      totalContacts: 0,
      totalPurchases: 0,
      bestPerformingMarketplace: null,
      worstPerformingMarketplace: null,
    },
    loading: isLoading,
    error,
    refresh: mutate,
    trackAction,
  };
}

// ============================================================================
// SEARCH PERFORMANCE
// ============================================================================

export interface SearchPerformanceAnalysis {
  marketplace: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalResults: number;
  totalNewResults: number;
  avgExecutionTime: number;
  medianExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  successRate: number;
  avgResultsPerSearch: number;
  avgNewResultsPerSearch: number;
  performanceScore: number;
  recentErrors?: Array<{
    message: string;
    executedAt: string;
  }>;
}

interface UseSearchPerformanceOptions {
  marketplace?: string;
  savedSearchId?: string;
  days?: number;
  sortBy?: 'fastest' | 'slowest' | 'most_reliable' | 'most_errors';
}

interface UseSearchPerformanceReturn {
  analysis: SearchPerformanceAnalysis[];
  summary: {
    totalSearches: number;
    successfulSearches: number;
    failedSearches: number;
    overallSuccessRate: number;
    avgExecutionTime: number;
    fastestMarketplace: SearchPerformanceAnalysis | null;
    slowestMarketplace: SearchPerformanceAnalysis | null;
    mostReliableMarketplace: SearchPerformanceAnalysis | null;
    leastReliableMarketplace: SearchPerformanceAnalysis | null;
  };
  loading: boolean;
  error: any;
  refresh: () => void;
  recordExecution: (execution: {
    savedSearchId: string;
    marketplace: string;
    executionTimeMs: number;
    resultsCount?: number;
    newResultsCount?: number;
    success: boolean;
    errorMessage?: string;
  }) => Promise<void>;
}

export function useSearchPerformance(
  options: UseSearchPerformanceOptions = {}
): UseSearchPerformanceReturn {
  const params = new URLSearchParams();
  if (options.marketplace) params.set('marketplace', options.marketplace);
  if (options.savedSearchId) params.set('savedSearchId', options.savedSearchId);
  if (options.days) params.set('days', options.days.toString());
  if (options.sortBy) params.set('sortBy', options.sortBy);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/analytics/search-performance?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  const recordExecution = async (execution: any) => {
    try {
      const response = await fetch('/api/analytics/search-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(execution),
      });

      if (!response.ok) {
        throw new Error('Failed to record search execution');
      }

      // Refresh the data after recording
      mutate();
    } catch (error) {
      console.error('[Search Performance] Failed to record execution:', error);
    }
  };

  return {
    analysis: data?.analysis || [],
    summary: data?.summary || {
      totalSearches: 0,
      successfulSearches: 0,
      failedSearches: 0,
      overallSuccessRate: 0,
      avgExecutionTime: 0,
      fastestMarketplace: null,
      slowestMarketplace: null,
      mostReliableMarketplace: null,
      leastReliableMarketplace: null,
    },
    loading: isLoading,
    error,
    refresh: mutate,
    recordExecution,
  };
}
