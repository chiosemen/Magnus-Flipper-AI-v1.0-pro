/**
 * useActivityFeed Hook
 * Real-time activity feed with Supabase Realtime subscriptions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Activity {
  id: string;
  type: 'NEW_LISTING' | 'PRICE_DROP' | 'PRICE_INCREASE' | 'SEARCH_MATCH' | 'ALERT_TRIGGERED' | 'CRAWLER_ERROR';
  marketplace: string;
  title: string;
  description?: string;
  listing?: {
    id: string;
    title: string;
    price: number;
    url: string;
    imageUrl?: string;
  };
  savedSearch?: any;
  metadata?: any;
  timestamp: string;
}

interface UseActivityFeedOptions {
  marketplace?: string;
  activityType?: string;
  userId?: string;
  limit?: number;
  realtimeEnabled?: boolean;
}

interface UseActivityFeedReturn {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  summary: {
    totalActivities: number;
    newListings: number;
    priceDrops: number;
    priceIncreases: number;
    searchMatches: number;
    alertsTriggered: number;
    crawlerErrors: number;
  };
}

export function useActivityFeed(options: UseActivityFeedOptions = {}): UseActivityFeedReturn {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalActivities: 0,
    newListings: 0,
    priceDrops: 0,
    priceIncreases: 0,
    searchMatches: 0,
    alertsTriggered: 0,
    crawlerErrors: 0,
  });

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.marketplace) params.set('marketplace', options.marketplace);
      if (options.activityType) params.set('activityType', options.activityType);
      if (options.userId) params.set('userId', options.userId);
      if (options.limit) params.set('limit', options.limit.toString());

      const response = await fetch(`/api/analytics/activity-feed?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch activity feed');
      }

      const data = await response.json();

      setActivities(data.activities || []);
      setSummary(data.summary || summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [options.marketplace, options.activityType, options.userId, options.limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!options.realtimeEnabled) return;

    const channel = supabase
      .channel('activity_feed_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed',
          filter: options.marketplace ? `marketplace=eq.${options.marketplace}` : undefined,
        },
        (payload) => {
          console.log('[Activity Feed] New activity:', payload.new);

          // Add new activity to the top of the list
          const newActivity = payload.new as any;
          setActivities((prev) => [
            {
              id: newActivity.id,
              type: newActivity.activity_type,
              marketplace: newActivity.marketplace,
              title: newActivity.title,
              description: newActivity.description,
              metadata: newActivity.metadata,
              timestamp: newActivity.created_at,
            },
            ...prev,
          ].slice(0, options.limit || 50)); // Keep only the latest N activities

          // Update summary
          setSummary((prev) => ({
            ...prev,
            totalActivities: prev.totalActivities + 1,
            newListings: newActivity.activity_type === 'NEW_LISTING' ? prev.newListings + 1 : prev.newListings,
            priceDrops: newActivity.activity_type === 'PRICE_DROP' ? prev.priceDrops + 1 : prev.priceDrops,
            priceIncreases: newActivity.activity_type === 'PRICE_INCREASE' ? prev.priceIncreases + 1 : prev.priceIncreases,
            searchMatches: newActivity.activity_type === 'SEARCH_MATCH' ? prev.searchMatches + 1 : prev.searchMatches,
            alertsTriggered: newActivity.activity_type === 'ALERT_TRIGGERED' ? prev.alertsTriggered + 1 : prev.alertsTriggered,
            crawlerErrors: newActivity.activity_type === 'CRAWLER_ERROR' ? prev.crawlerErrors + 1 : prev.crawlerErrors,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options.realtimeEnabled, options.marketplace, options.limit]);

  return {
    activities,
    loading,
    error,
    refresh: fetchActivities,
    summary,
  };
}
