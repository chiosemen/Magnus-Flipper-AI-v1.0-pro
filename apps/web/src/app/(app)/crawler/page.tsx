'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAPI } from '@/hooks/use-api'
import { mockCrawlerStatus } from '@/lib/mock-data'
import { formatNumber } from '@/lib/utils'
import { Activity, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function CrawlerPage() {
  const { data: crawlers, isUsingFallback } = useAPI('/api/crawlers', {
    fallbackData: mockCrawlerStatus,
    refreshInterval: 5000,
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="h-8 w-8 text-cyan-mint animate-pulse" />
            Crawler Status
          </h1>
          <p className="text-muted-foreground">
            Live monitoring of marketplace crawlers and data collection
          </p>
        </div>
        {isUsingFallback && <Badge variant="warning">Using Mock Data</Badge>}
      </div>

      {/* Crawler Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {crawlers?.map((crawler: any) => (
          <Card key={crawler.id} className="neon-glow-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{crawler.marketplace}</CardTitle>
                <Badge
                  variant={
                    crawler.status === 'active'
                      ? 'success'
                      : crawler.status === 'idle'
                      ? 'secondary'
                      : 'destructive'
                  }
                  className="animate-pulse"
                >
                  {crawler.status === 'active' && (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  )}
                  {crawler.status === 'error' && (
                    <XCircle className="mr-1 h-3 w-3" />
                  )}
                  {crawler.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items Found</span>
                  <span className="font-mono font-semibold">
                    {formatNumber(crawler.itemsFound)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-mono font-semibold text-green-500">
                    {crawler.successRate}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Response</span>
                  <span className="font-mono font-semibold">
                    {crawler.avgResponseTime}s
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Last run {formatDistanceToNow(new Date(crawler.lastRun))} ago
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Chart */}
      <Card className="neon-glow-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-mint" />
            Crawler Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Chart visualization would go here (integrate with recharts)
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
