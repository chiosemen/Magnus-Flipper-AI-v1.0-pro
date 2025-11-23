'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAPI } from '@/hooks/use-api'
import { mockAlerts } from '@/lib/mock-data'
import { Bell, AlertCircle, TrendingUp, ShoppingBag, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const priorityIcons = {
  high: AlertCircle,
  medium: TrendingUp,
  low: ShoppingBag,
}

const priorityColors = {
  high: 'destructive',
  medium: 'warning',
  low: 'secondary',
}

export default function AlertsPage() {
  const { data: alerts, isUsingFallback } = useAPI('/api/alerts', {
    fallbackData: mockAlerts,
    refreshInterval: 10000,
  })

  const unreadCount = alerts?.filter((a: any) => !a.read).length || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8 text-cyan-mint" />
            Alert Center
          </h1>
          <p className="text-muted-foreground">
            Stay on top of high-value opportunities and price changes
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isUsingFallback && <Badge variant="warning">Using Mock Data</Badge>}
          <Badge variant="neon" className="text-base px-4 py-2">
            {unreadCount} Unread
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Button variant="default">
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark All as Read
            </Button>
            <Button variant="outline">Configure Alerts</Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts?.map((alert: any) => {
          const Icon = priorityIcons[alert.priority as keyof typeof priorityIcons]
          const priorityVariant = priorityColors[alert.priority as keyof typeof priorityColors] as any

          return (
            <Card
              key={alert.id}
              className={`neon-glow-hover ${!alert.read ? 'border-cyan-mint/50' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`rounded-lg p-3 ${
                      alert.priority === 'high'
                        ? 'bg-red-500/10'
                        : alert.priority === 'medium'
                        ? 'bg-yellow-500/10'
                        : 'bg-blue-500/10'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        alert.priority === 'high'
                          ? 'text-red-500'
                          : alert.priority === 'medium'
                          ? 'text-yellow-500'
                          : 'text-blue-500'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{alert.title}</h3>
                        <p className="mt-1 text-muted-foreground">{alert.message}</p>
                      </div>
                      <Badge variant={priorityVariant}>{alert.priority}</Badge>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.timestamp))} ago
                      </span>
                      {!alert.read && (
                        <Badge variant="neon" className="text-xs">
                          NEW
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
