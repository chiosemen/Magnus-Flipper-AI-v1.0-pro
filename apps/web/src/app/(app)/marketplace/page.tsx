'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAPI } from '@/hooks/use-api'
import { mockRecentListings } from '@/lib/mock-data'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { ShoppingCart, MapPin, Clock, ExternalLink, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function MarketplacePage() {
  const { data: listings, isUsingFallback } = useAPI('/api/listings', {
    fallbackData: mockRecentListings,
    refreshInterval: 15000,
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketplace Listings</h1>
          <p className="text-muted-foreground">
            Curated high-value arbitrage opportunities from multiple marketplaces
          </p>
        </div>
        {isUsingFallback && <Badge variant="warning">Using Mock Data</Badge>}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" size="sm">
              All Categories
            </Button>
            <Button variant="outline" size="sm">
              Electronics
            </Button>
            <Button variant="outline" size="sm">
              Cameras
            </Button>
            <Button variant="outline" size="sm">
              Computers
            </Button>
            <Button variant="outline" size="sm">
              Phones
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Listings Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {listings?.map((listing: any) => (
          <Card key={listing.id} className="flex flex-col neon-glow-hover">
            <CardHeader>
              <div className="aspect-video rounded-lg bg-gradient-to-br from-indigo-blue/20 to-cyan-mint/20 flex items-center justify-center mb-4">
                <ShoppingCart className="h-16 w-16 text-cyan-mint" />
              </div>
              <CardTitle className="line-clamp-2">{listing.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {listing.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatDistanceToNow(new Date(listing.postedAt))} ago
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">List Price</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(listing.price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Market Value</span>
                  <span className="font-mono font-semibold text-cyan-mint">
                    {formatCurrency(listing.marketValue)}
                  </span>
                </div>
                <div className="h-px bg-border/50"></div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Potential Profit</span>
                  <Badge variant="neon" className="font-mono">
                    +{formatCurrency(listing.profit)}
                  </Badge>
                </div>
              </div>
              <Badge variant="outline">{listing.condition}</Badge>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="neon">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Listing
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
