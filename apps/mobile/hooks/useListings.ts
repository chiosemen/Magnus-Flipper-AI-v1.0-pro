"use client";

import { useEffect, useState, useCallback } from "react";
import { api, Listing } from "../lib/api";

interface FeedParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  pageSize?: number;
}

export function useListingsFeed(params: FeedParams = {}) {
  const { pageSize = 10, ...filters } = params;
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextPage: number, isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        setLoading(true);
        setError(null);
        const res = await api.listings.list({ ...filters, page: nextPage, pageSize });
        setListings((prev) => (nextPage === 1 ? res.items : [...prev, ...res.items]));
        setHasMore(!!res.nextPage);
        if (res.nextPage) setPage(res.nextPage);
      } catch (err: any) {
        setError(err?.message || "Failed to load listings");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters, pageSize]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const loadMore = () => {
    if (!loading && hasMore) {
      load(page + 1);
    }
  };

  const refresh = () => load(1, true);

  return { listings, loading, refreshing, error, hasMore, loadMore, refresh };
}

export function useListing(id?: string) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.listings.detail(id);
        if (!cancelled) setListing(res);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load listing");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { listing, loading, error };
}
