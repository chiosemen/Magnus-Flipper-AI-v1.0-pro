'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAlerts, useSavedSearches } from '@/hooks/use-app-api'
import { Bell, Filter, ExternalLink, MapPin, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default function AlertsPage() {
  const { alerts, stats, isLoading } = useAlerts()
  const { searches } = useSavedSearches()
  const [selectedSearchId, setSelectedSearchId] = useState<string>('all')

  const filteredAlerts = useMemo(() => {
    if (selectedSearchId === 'all') return alerts
    return alerts.filter((alert) => alert.savedSearchId === selectedSearchId)
  }, [alerts, selectedSearchId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recent Alerts</h1>
          <p className="text-muted-foreground">
            New marketplace matches from your saved searches
            {stats && (
              <span className="ml-2 text-cyan-mint">
                • {filteredAlerts.length} total
              </span>
            )}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/searches/new">Create Search</Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <label className="text-sm text-muted-foreground mb-2 block">Filter by search</label>
            <select
              value={selectedSearchId}
              onChange={(e) => setSelectedSearchId(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All searches ({alerts.length})</option>
              {searches.map((search) => {
                const count = alerts.filter((a) => a.savedSearchId === search.id).length
                return (
                  <option key={search.id} value={search.id}>
                    {search.name} ({count})
                  </option>
                )
              })}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No alerts yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {selectedSearchId === 'all'
                ? "Create a search to start monitoring marketplaces and you'll see matches here"
                : "This search hasn't found any matches yet"}
            </p>
            {selectedSearchId === 'all' ? (
              <Button asChild>
                <Link href="/searches/new">Create Your First Search</Link>
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setSelectedSearchId('all')}>
                View All Alerts
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAlerts.map((alert) => (
            <Link key={alert.id} href={`/listings/${alert.listingId}`}>
              <Card className="group overflow-hidden transition-all hover:border-cyan-mint/60 hover:shadow-lg h-full">
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="aspect-video w-full bg-gradient-to-br from-indigo-blue/20 to-cyan-mint/10 relative overflow-hidden">
                    {alert.listing?.imageUrls && alert.listing.imageUrls[0] ? (
                      <img
                        src={alert.listing.imageUrls[0]}
                        alt={alert.listing.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Bell className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-black/60 backdrop-blur-sm">
                        {alert.listing?.site?.toLowerCase().replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold line-clamp-2 flex-1 group-hover:text-cyan-mint transition-colors">
                        {alert.listing?.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(alert.matchedAt), { addSuffix: true })}</span>
                    </div>

                    {alert.listing?.city && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{alert.listing.city}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-lg font-bold font-mono">
                        {formatCurrency(alert.listing?.price || 0)}
                      </span>
                      {alert.listing?.condition && (
                        <Badge variant="outline" className="capitalize">
                          {alert.listing.condition.toLowerCase().replace('_', ' ')}
                        </Badge>
                      )}
                    </div>

                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground truncate">
                        From: {alert.savedSearch?.name || 'Unknown search'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
