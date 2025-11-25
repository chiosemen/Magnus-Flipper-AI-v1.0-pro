'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAPI } from '@/hooks/use-api'
import { mockQueueStats } from '@/lib/mock-data'
import { formatNumber } from '@/lib/utils'
import { Database, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'

export default function QueuePage() {
  const { data: queueStats, isUsingFallback } = useAPI('/api/queue/stats', {
    fallbackData: mockQueueStats,
    refreshInterval: 3000,
  })

  const queues = Object.entries(queueStats || {}).map(([name, stats]: [string, any]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    ...stats,
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="h-8 w-8 text-cyan-mint" />
            Redis Queue Monitor
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring of job queues and processing status
          </p>
        </div>
        {isUsingFallback && <Badge variant="warning">Using Mock Data</Badge>}
      </div>

      {/* Queue Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {queues?.map((queue: any) => (
          <Card key={queue.name} className="neon-glow-hover">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{queue.name} Queue</span>
                <Database className="h-5 w-5 text-cyan-mint" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
                  <div className="flex items-center gap-2 text-yellow-500 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium">Waiting</span>
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {formatNumber(queue.waiting)}
                  </div>
                </div>
                <div className="rounded-lg border border-cyan-mint/20 bg-cyan-mint/10 p-3">
                  <div className="flex items-center gap-2 text-cyan-mint mb-1">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span className="text-xs font-medium">Active</span>
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {formatNumber(queue.active)}
                  </div>
                </div>
                <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                  <div className="flex items-center gap-2 text-green-500 mb-1">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Completed</span>
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {formatNumber(queue.completed)}
                  </div>
                </div>
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                  <div className="flex items-center gap-2 text-red-500 mb-1">
                    <XCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Failed</span>
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {formatNumber(queue.failed)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Queue Throughput Chart */}
      <Card className="neon-glow-hover">
        <CardHeader>
          <CardTitle>Queue Throughput Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Throughput chart visualization would go here (integrate with recharts)
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
