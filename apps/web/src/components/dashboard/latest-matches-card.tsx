import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { Listing } from '@magnus-flipper-ai/core'
import { formatCurrency } from '@/lib/utils'

export interface LatestMatchesCardProps {
  listings: Listing[]
  isLoading?: boolean
}

/**
 * LatestMatchesCard - Displays grid of latest matching listings
 */
export function LatestMatchesCard({ listings, isLoading }: LatestMatchesCardProps) {
  return (
    <Card className="neon-glow-hover">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-mint" />
          Latest Matches
        </CardTitle>
        <Badge variant="secondary">Live</Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, idx) => (
              <Card key={idx}>
                <CardContent className="space-y-3 p-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 transition hover:border-cyan-mint/60 hover:bg-muted/50">
                  <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-indigo-blue/20 to-cyan-mint/10" />
                  <div className="mt-3 space-y-1">
                    <p className="line-clamp-2 font-semibold">{listing.title}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {listing.site?.toLowerCase()} •{' '}
                      {listing.city || listing.region || 'Unknown location'}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-mono text-lg">
                        {formatCurrency(listing.price)}
                      </span>
                      <Badge variant="outline" className="capitalize">
                        {listing.condition?.toLowerCase() || 'n/a'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            No matches yet. Try adding a search.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
