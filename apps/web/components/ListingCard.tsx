import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Listing } from '@magnus-flipper-ai/core';
import { formatCurrency } from '@/lib/utils';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link href={`/listings/${listing.id}`} className="block h-full">
      <Card className="h-full border-border/60 bg-muted/20 transition hover:border-cyan-mint/60">
        <CardContent className="p-4 space-y-3">
          <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-indigo-blue/20 to-cyan-mint/10" />
          <div className="space-y-1">
            <p className="line-clamp-2 font-semibold">{listing.title}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {listing.site?.toLowerCase()} • {listing.city || listing.region || 'Unknown'}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg">{formatCurrency(listing.price)}</span>
            <Badge variant="outline" className="capitalize">
              {listing.condition?.toLowerCase() || 'n/a'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
