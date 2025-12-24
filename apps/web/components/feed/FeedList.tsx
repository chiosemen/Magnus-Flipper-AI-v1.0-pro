"use client";

import { FeedCard } from "./FeedCard";
import { Button } from "@/marketing-swoopa/components/ui/button";
import { Card } from "@/marketing-swoopa/components/ui/card";
import { SkeletonList } from "../ui/Skeleton";
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
    return <SkeletonList count={5} />;
  }

  if (listings.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed">
        <div className="max-w-md mx-auto space-y-3">
          <div className="text-4xl opacity-50">📊</div>
          <p className="text-sm font-medium text-foreground">{emptyMessage || "No deals found yet"}</p>
          <p className="text-xs text-text-secondary">
            Deals will appear here as they're discovered. Check back soon or refine your search criteria.
          </p>
        </div>
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
