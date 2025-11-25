import { ListingCard } from "@/components/ListingCard";
import { Card, CardContent } from "@/components/ui/card";
import type { Listing } from "@magnus-flipper-ai/core";

interface SearchFeedGridProps {
  listings: Listing[];
  isLoading?: boolean;
}

export function SearchFeedGrid({ listings, isLoading }: SearchFeedGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card key={idx} className="border-border/40 bg-slate-950/70">
            <CardContent className="space-y-3 p-4">
              <div className="h-32 rounded-lg bg-muted/40" />
              <div className="h-4 w-3/4 rounded bg-muted/60" />
              <div className="h-3 w-1/2 rounded bg-muted/50" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!listings.length) {
    return (
      <Card className="border-border/40 bg-slate-950/70">
        <CardContent className="p-6 text-sm text-muted-foreground">
          No listings yet. Try broadening your filters or refreshing.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
