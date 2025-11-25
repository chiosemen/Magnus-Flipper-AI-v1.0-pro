import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, Sparkles } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import type { Listing, ListingMatch, SavedSearch } from '@magnus-flipper-ai/core'

export type AlertWithDetails = ListingMatch & {
  listing: Listing
  savedSearch?: SavedSearch
}

export interface RecentAlertsCardProps {
  alerts: AlertWithDetails[]
  limit?: number
}

/**
 * RecentAlertsCard - Displays recent alert notifications
 */
export function RecentAlertsCard({ alerts, limit = 3 }: RecentAlertsCardProps) {
  const displayAlerts = alerts.slice(0, limit)

  return (
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
            {displayAlerts.length > 0 ? (
              displayAlerts.map((alert) => (
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
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No alerts yet.</p>
            )}
          </div>
        </div>

        <Button className="w-full" asChild>
          <Link href="/alerts">
            <Sparkles className="mr-2 h-4 w-4" />
            Review alerts
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
