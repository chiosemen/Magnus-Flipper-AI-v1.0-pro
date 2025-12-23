"use client";

import { FeedCard } from "./FeedCard";
import { Button } from "@/marketing-swoopa/components/ui/button";
import { Card } from "@/marketing-swoopa/components/ui/card";
import type { AggregatedListing } from "@/lib/types/feed";

interface FeedListProps {
  listings: AggregatedListing[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onListingClick?: (listing: AggregatedListing) => void;
  emptyMessage?: string;
}

/**
 * FeedList - Displays a list of feed items
 * Supports infinite scroll and loading states
 */
export function FeedList({
  listings,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onListingClick,
  emptyMessage = "No listings found",
}: FeedListProps) {
  if (isLoading && listings.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-surfaceSubtle rounded-md"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surfaceSubtle rounded w-3/4"></div>
                <div className="h-6 bg-surfaceSubtle rounded w-1/4"></div>
                <div className="h-3 bg-surfaceSubtle rounded w-1/2"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-body-m text-text-secondary">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => (
        <FeedCard
          key={listing.id}
          listing={listing}
          onClick={onListingClick}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="secondary"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
