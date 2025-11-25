'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import {
  Bell,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useSavedSearches, useAlerts, useListingsFeed } from '@/hooks/use-app-api'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

function ProgressBar({ value, label }: { value: number; label: string }) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <span>{clamped}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-blue to-cyan-mint transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { searches, isLoading: loadingSearches } = useSavedSearches()
  const { stats: alertStats, alerts } = useAlerts()
  const { feed, isLoading: loadingFeed } = useListingsFeed({ page: 1, pageSize: 6 })

  const usage = useMemo(() => {
    const allowance = 10 // this would come from plan metadata
    const used = searches.length
    return {
      used,
      allowance,
      percent: allowance ? Math.min(100, Math.round((used / allowance) * 100)) : 0,
    }
  }, [searches.length])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Magnus Marketplace Dashboard</h1>
          <p className="text-muted-foreground">
            Track saved searches, alerts, and fresh flips in one place.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" asChild>
            <Link href="/results">Browse Results</Link>
          </Button>
          <Button asChild>
            <Link href="/searches/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Search
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="neon-glow-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cyan-mint" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-xl font-semibold">Pro Trader</p>
              </div>
              <Badge variant="neon">Active</Badge>
            </div>
            <ProgressBar value={usage.percent} label={`Saved searches ${usage.used}/${usage.allowance}`} />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Alerts</span>
              <span>{alertStats?.unread ?? 0} unread</span>
            </div>
            <Button variant="outline" asChild>
              <Link href="/billing">Manage Plan</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="neon-glow-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-cyan-mint" />
              Alerts Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/50 bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Recent alerts</span>
                <Badge variant="secondary">{alerts.length}</Badge>
              </div>
              <div className="mt-3 space-y-2">
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{alert.savedSearch?.name || 'Match'}</p>
                      <p className="text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.matchedAt))} ago
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {alert.listing?.site?.toLowerCase() || 'match'}
                    </Badge>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-sm text-muted-foreground">No alerts yet.</p>
                )}
              </div>
            </div>
            <Button asChild>
              <Link href="/alerts">
                <Sparkles className="mr-2 h-4 w-4" />
                Review alerts
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="neon-glow-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-mint" />
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/searches"
              className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3 transition hover:border-cyan-mint/60"
            >
              <span>Manage saved searches</span>
              <Badge variant="outline">{searches.length}</Badge>
            </Link>
            <Link
              href="/results"
              className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3 transition hover:border-cyan-mint/60"
            >
              <span>See live results</span>
              <TrendingUp className="h-4 w-4 text-cyan-mint" />
            </Link>
            <Link
              href="/settings"
              className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3 transition hover:border-cyan-mint/60"
            >
              <span>Account settings</span>
              <Badge variant="outline">Secure</Badge>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="neon-glow-hover">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-mint" />
            Latest Matches
          </CardTitle>
          <Badge variant="secondary">Live</Badge>
        </CardHeader>
        <CardContent>
          {loadingFeed ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {feed?.listings?.map((listing) => (
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
              {feed?.listings?.length === 0 && (
                <p className="text-sm text-muted-foreground">No matches yet. Try adding a search.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
