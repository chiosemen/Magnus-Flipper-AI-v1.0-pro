"use client";

import { AppShell } from "@/src/components/layout/AppShell";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Button } from "@magnus-flipper-ai/ui/components/Button";
import { useState } from "react";
import { FeedList } from "@/src/components/feed/FeedList";
import { FeedFilters } from "@/src/components/feed/FeedFilters";
import { RealtimeIndicator } from "@/src/components/feed/RealtimeIndicator";
import { useFeed } from "@/hooks/useFeed";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import { useInfiniteFeed } from "@/hooks/useFeed";
import { useMemo } from "react";
import type { FeedFilters as FeedFiltersType, FeedViewMode } from "@magnus-flipper-ai/core/types/feed";
import type { AggregatedListing } from "@magnus-flipper-ai/feed-engine";

/**
 * Feed Page - Main feed view with paginated and real-time options
 * Uses AppShell layout and design tokens
 */
export default function FeedPage() {
  const [viewMode, setViewMode] = useState<FeedViewMode>("paginated");
  const [filters, setFilters] = useState<FeedFiltersType>({
    marketplaces: [],
  });

  // Paginated feed
  const {
    data: feedData,
    isLoading: feedLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteFeed({
    marketplaces: filters.marketplaces,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    enabled: viewMode === "paginated" || viewMode === "hybrid",
  });

  // Real-time feed
  const {
    status: realtimeStatus,
    listings: realtimeListings,
    lastEvent,
  } = useRealtimeFeed({
    marketplaces: filters.marketplaces,
    enabled: viewMode === "realtime" || viewMode === "hybrid",
  });

  // Combine listings based on view mode
  const displayListings: AggregatedListing[] = useMemo(() => {
    if (viewMode === "realtime") {
      return realtimeListings;
    }
    if (viewMode === "hybrid") {
      const feedListings = feedData?.pages.flatMap((p) => p.listings) || [];
      // Merge and deduplicate by ID
      const seen = new Set<string>();
      const merged: AggregatedListing[] = [];
      [...realtimeListings, ...feedListings].forEach((listing) => {
        if (!seen.has(listing.id)) {
          seen.add(listing.id);
          merged.push(listing);
        }
      });
      return merged;
    }
    return feedData?.pages.flatMap((p) => p.listings) || [];
  }, [viewMode, realtimeListings, feedData]);

  const handleListingClick = (listing: AggregatedListing) => {
    if (listing.url) {
      window.open(listing.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Live Feed"
        subtitle="Discover deals across multiple marketplaces"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Feed" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {(viewMode === "realtime" || viewMode === "hybrid") && (
              <RealtimeIndicator
                status={realtimeStatus}
                lastUpdate={lastEvent ? new Date(lastEvent.timestamp) : undefined}
              />
            )}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "paginated" ? "default" : "secondary"}
                size="sm"
                onClick={() => setViewMode("paginated")}
              >
                Paginated
              </Button>
              <Button
                variant={viewMode === "realtime" ? "default" : "secondary"}
                size="sm"
                onClick={() => setViewMode("realtime")}
              >
                Real-time
              </Button>
              <Button
                variant={viewMode === "hybrid" ? "default" : "secondary"}
                size="sm"
                onClick={() => setViewMode("hybrid")}
              >
                Hybrid
              </Button>
            </div>
          </div>
        }
      />

      {/* Filters */}
      <div className="mb-6">
        <FeedFilters
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Feed List */}
      <FeedList
        listings={displayListings}
        isLoading={feedLoading}
        hasMore={hasNextPage || false}
        onLoadMore={() => fetchNextPage()}
        onListingClick={handleListingClick}
        emptyMessage="No listings found. Try adjusting your filters."
      />
    </AppShell>
  );
}
