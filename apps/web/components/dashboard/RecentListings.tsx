import { ListingCard } from "@/components/ListingCard";
import type { Listing } from "@magnus-flipper-ai/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentListingsProps {
  listings: Listing[];
}

export function RecentListings({ listings }: RecentListingsProps) {
  return (
    <Card className="border-border/40 bg-slate-950/70">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Latest matches</span>
          <span className="text-sm font-normal text-muted-foreground">{listings.length} items</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent listings yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
