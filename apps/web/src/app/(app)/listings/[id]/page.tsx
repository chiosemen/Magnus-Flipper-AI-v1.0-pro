'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useListing } from '@/hooks/use-app-api'
import { formatDistanceToNow } from 'date-fns'
import { ExternalLink } from 'lucide-react'

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>()
  const { listing, isLoading } = useListing(params.id)

  if (isLoading) {
    return <p className="text-muted-foreground">Loading listing...</p>
  }

  if (!listing) {
    return <p className="text-muted-foreground">Listing not found.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground capitalize">{listing.site?.toLowerCase()}</p>
          <h1 className="text-3xl font-bold">{listing.title}</h1>
          <p className="text-muted-foreground">
            {listing.city || listing.region || 'Unknown location'} •{' '}
            {listing.postedAt ? `${formatDistanceToNow(new Date(listing.postedAt))} ago` : 'posted'}
          </p>
        </div>
        <Badge variant="secondary">{listing.condition || 'n/a'}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 neon-glow-hover">
          <CardContent className="p-4 space-y-3">
            <div className="aspect-video rounded-xl bg-gradient-to-br from-indigo-blue/20 to-cyan-mint/10" />
            <p className="text-sm text-muted-foreground">{listing.description || 'No description.'}</p>
          </CardContent>
        </Card>
        <Card className="neon-glow-hover">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="font-mono text-xl">${listing.price}</span>
            </div>
            {listing.model && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Model</span>
                <span className="font-semibold">{listing.model}</span>
              </div>
            )}
            {listing.manufacturer && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Manufacturer</span>
                <span className="font-semibold">{listing.manufacturer}</span>
              </div>
            )}
            <Button asChild className="w-full">
              <a href={listing.url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open original
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
