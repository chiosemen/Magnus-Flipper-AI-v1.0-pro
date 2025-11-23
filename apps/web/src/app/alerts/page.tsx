'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAlerts } from '@/hooks/use-app-api'
import { Bell, CheckCircle, Link2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export default function AlertsPage() {
  const { alerts, stats, isLoading } = useAlerts()
  const [showUnread, setShowUnread] = useState(false)

  const filteredAlerts = showUnread ? alerts.filter((a) => !a.notified) : alerts

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8 text-cyan-mint" />
            Alert Center
          </h1>
          <p className="text-muted-foreground">
            Pulled from /api/alerts/recent with Supabase JWT auth header.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary">{stats?.unread ?? 0} unread</Badge>
          <Button variant="outline" onClick={() => setShowUnread((v) => !v)}>
            {showUnread ? 'Show all' : 'Show unread'}
          </Button>
        </div>
      </div>

      <Card className="neon-glow-hover">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent alerts</CardTitle>
          <Button variant="outline" size="sm">
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p className="text-sm text-muted-foreground">Loading alerts...</p>}
          {!isLoading && filteredAlerts.length === 0 && (
            <p className="text-sm text-muted-foreground">No alerts yet.</p>
          )}
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-xl border border-border/60 bg-muted/30 p-4 transition hover:border-cyan-mint/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {alert.savedSearch?.name || 'Saved search'}
                  </p>
                  <p className="text-lg font-semibold">{alert.listing?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(alert.matchedAt))} ago •{' '}
                    {alert.listing?.site?.toLowerCase()}
                  </p>
                </div>
                <Badge variant="outline">{alert.listing?.city || 'Unknown'}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Link href={`/listings/${alert.listingId}`} className="inline-flex items-center gap-2">
                  <Link2 className="h-4 w-4" /> View listing
                </Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
