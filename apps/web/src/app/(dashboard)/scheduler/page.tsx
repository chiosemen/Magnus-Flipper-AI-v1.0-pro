'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getSchedulerJobs, SchedulerJob } from '@/lib/api'
import { formatRelativeTime, formatDate } from '@/lib/utils'
import { Calendar, RefreshCw, Clock, Play, Pause, AlertCircle } from 'lucide-react'

export default function SchedulerPage() {
  const [jobs, setJobs] = useState<SchedulerJob[]>([])
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)

  const fetchJobs = async () => {
    setLoading(true)
    const result = await getSchedulerJobs()
    if (result.data) {
      setJobs(result.data)
      setUsingMock(result.usedMock || false)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: SchedulerJob['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
    }
  }

  const getStatusIcon = (status: SchedulerJob['status']) => {
    switch (status) {
      case 'active':
        return <Play className="w-5 h-5 text-green-600" />
      case 'paused':
        return <Pause className="w-5 h-5 text-gray-600" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />
    }
  }

  const activeCount = jobs.filter(j => j.status === 'active').length
  const pausedCount = jobs.filter(j => j.status === 'paused').length
  const failedCount = jobs.filter(j => j.status === 'failed').length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scheduler Status</h1>
          <p className="mt-2 text-sm text-gray-600">
            {activeCount} active job{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {usingMock && <Badge variant="warning">Mock Data</Badge>}
          <Button onClick={fetchJobs} disabled={loading} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused Jobs</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pausedCount}</div>
            <p className="text-xs text-muted-foreground">Temporarily stopped</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedCount}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Job List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Scheduled Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && jobs.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-gray-600">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No scheduled jobs found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(job.status)}
                        <span className="font-medium">{job.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {job.schedule}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatRelativeTime(job.lastRun)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-900">{formatRelativeTime(job.nextRun)}</span>
                        <span className="text-xs text-gray-500">{formatDate(job.nextRun)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
