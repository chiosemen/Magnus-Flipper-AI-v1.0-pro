"use client";

import Image from "next/image";
import { Card } from "@magnus-flipper-ai/ui/components";
import { Badge } from "@magnus-flipper-ai/ui/components";
import type { AggregatedListing } from "@magnus-flipper-ai/feed-engine";
import { sanitizeImageUrl } from "@/lib/utils/imageResolver";

interface FeedCardProps {
  listing: AggregatedListing;
  onClick?: (listing: AggregatedListing) => void;
}

/**
 * FeedCard - Displays a single feed listing item
 * Uses design tokens for consistent styling
 */
export function FeedCard({ listing, onClick }: FeedCardProps) {
  const handleClick = () => {
    onClick?.(listing);
  };

  const marketplaceColors: Record<string, string> = {
    facebook: "bg-blue-500/20 text-blue-400",
    ebay: "bg-purple-500/20 text-purple-400",
    vinted: "bg-green-500/20 text-green-400",
    gumtree: "bg-yellow-500/20 text-yellow-400",
    depop: "bg-pink-500/20 text-pink-400",
    offerup: "bg-orange-500/20 text-orange-400",
  };

  const marketplaceColor = marketplaceColors[listing.marketplace] || "bg-surfaceSubtle text-text-secondary";

  return (
    <Card
      className="p-4 hover:shadow-card-hover transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex gap-4">
        {/* Image */}
        {listing.imageUrl && (
          <div className="flex-shrink-0 relative w-24 h-24">
            <Image
              src={sanitizeImageUrl(listing.imageUrl)}
              alt={listing.title || "Listing"}
              fill
              className="object-cover rounded-md"
              sizes="96px"
              onError={() => {
                // Image failed to load, component will handle fallback
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-h5 font-heading font-semibold text-foreground truncate">
              {listing.title}
            </h3>
            <Badge className={marketplaceColor}>
              {listing.marketplace}
            </Badge>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-h4 font-bold text-success">
              £{listing.price?.toFixed(2) || "0.00"}
            </span>
          </div>

          {/* Location */}
          {listing.location && (
            <p className="text-body-s text-text-secondary mb-2">
              📍 {listing.location}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-body-s text-text-secondary">
            {listing.firstSeen && (
              <span>
                First seen: {new Date(listing.firstSeen).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
