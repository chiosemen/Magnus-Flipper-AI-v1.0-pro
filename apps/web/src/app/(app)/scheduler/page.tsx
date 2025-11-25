'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAPI } from '@/hooks/use-api'
import { mockScheduledJobs } from '@/lib/mock-data'
import { Clock, Play, Pause, RotateCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function SchedulerPage() {
  const { data: jobs, isUsingFallback } = useAPI('/api/scheduler/jobs', {
    fallbackData: mockScheduledJobs,
    refreshInterval: 5000,
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="h-8 w-8 text-cyan-mint" />
            Scheduler Timeline
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor automated job scheduling
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isUsingFallback && <Badge variant="warning">Using Mock Data</Badge>}
          <Button variant="neon">
            <Play className="mr-2 h-4 w-4" />
            Add New Job
          </Button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {jobs?.map((job: any) => (
          <Card key={job.id} className="neon-glow-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`rounded-lg p-3 ${
                      job.status === 'running'
                        ? 'bg-cyan-mint/10'
                        : job.status === 'scheduled'
                        ? 'bg-indigo-blue/10'
                        : 'bg-muted'
                    }`}
                  >
                    <Clock
                      className={`h-6 w-6 ${
                        job.status === 'running'
                          ? 'text-cyan-mint animate-pulse'
                          : job.status === 'scheduled'
                          ? 'text-indigo-blue'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{job.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-mono">{job.schedule}</span>
                      <span>•</span>
                      <span>
                        Last run: {formatDistanceToNow(new Date(job.lastRun))} ago
                      </span>
                      <span>•</span>
                      <span>
                        Next run: {formatDistanceToNow(new Date(job.nextRun))}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      job.status === 'running'
                        ? 'neon'
                        : job.status === 'scheduled'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {job.status === 'running' && (
                      <RotateCw className="mr-1 h-3 w-3 animate-spin" />
                    )}
                    {job.status.toUpperCase()}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    {job.status === 'running' ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timeline Visualization */}
      <Card className="neon-glow-hover">
        <CardHeader>
          <CardTitle>Upcoming Jobs Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Timeline visualization would go here
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
