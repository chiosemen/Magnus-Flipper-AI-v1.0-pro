"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { RealtimeEvent, FeedConnectionStatus } from "@magnus-flipper-ai/core/types/feed";
import type { AggregatedListing } from "@magnus-flipper-ai/feed-engine";

interface UseRealtimeFeedOptions {
  marketplaces?: string[];
  limit?: number;
  enabled?: boolean;
  onNewListings?: (listings: AggregatedListing[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to consume Server-Sent Events (SSE) for real-time feed updates
 */
export function useRealtimeFeed(options: UseRealtimeFeedOptions = {}) {
  const {
    marketplaces = [],
    limit = 20,
    enabled = true,
    onNewListings,
    onError,
  } = options;

  const [status, setStatus] = useState<FeedConnectionStatus>("disconnected");
  const [listings, setListings] = useState<AggregatedListing[]>([]);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    setStatus("connecting");

    const params = new URLSearchParams();
    if (marketplaces.length > 0) {
      params.set("marketplaces", marketplaces.join(","));
    }
    params.set("limit", limit.toString());

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/search/realtime?${params.toString()}`;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setStatus("connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const data: RealtimeEvent = JSON.parse(event.data);
        setLastEvent(data);

        if (data.type === "connected") {
          setStatus("connected");
        } else if (data.type === "listings" && data.listings) {
          setListings((prev) => {
            // Merge new listings, avoiding duplicates
            const existingIds = new Set(prev.map((l) => l.id));
            const newListings = data.listings!.filter((l) => !existingIds.has(l.id));
            const merged = [...newListings, ...prev].slice(0, limit * 3); // Keep last 3 batches
            onNewListings?.(newListings);
            return merged;
          });
        } else if (data.type === "error") {
          setStatus("error");
          const error = new Error(data.error || "Unknown error");
          onError?.(error);
        } else if (data.type === "closed") {
          setStatus("disconnected");
          eventSource.close();
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
        const err = error instanceof Error ? error : new Error("Failed to parse SSE message");
        onError?.(err);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      setStatus("error");
      const err = new Error("SSE connection failed");
      onError?.(err);
      eventSource.close();
    };
  }, [enabled, marketplaces.join(","), limit, onNewListings, onError]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    status,
    listings,
    lastEvent,
    connect,
    disconnect,
  };
}
