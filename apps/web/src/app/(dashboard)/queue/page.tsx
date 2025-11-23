'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getQueueMetrics, QueueMetrics } from '@/lib/api'
import { Database, RefreshCw, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'

export default function QueuePage() {
  const [queues, setQueues] = useState<QueueMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)

  const fetchQueues = async () => {
    setLoading(true)
    const result = await getQueueMetrics()
    if (result.data) {
      setQueues(result.data)
      setUsingMock(result.usedMock || false)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchQueues()
    const interval = setInterval(fetchQueues, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const totalWaiting = queues.reduce((sum, q) => sum + q.waiting, 0)
  const totalActive = queues.reduce((sum, q) => sum + q.active, 0)
  const totalCompleted = queues.reduce((sum, q) => sum + q.completed, 0)
  const totalFailed = queues.reduce((sum, q) => sum + q.failed, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Redis Queue Monitor</h1>
          <p className="mt-2 text-sm text-gray-600">
            Real-time monitoring of job queues
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {usingMock && <Badge variant="warning">Mock Data</Badge>}
          <Button onClick={fetchQueues} disabled={loading} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWaiting}</div>
            <p className="text-xs text-muted-foreground">Jobs in queue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Loader className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActive}</div>
            <p className="text-xs text-muted-foreground">Currently processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompleted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFailed}</div>
            <p className="text-xs text-muted-foreground">Error count</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Queue Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && queues.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-gray-600">Loading queue metrics...</p>
            </div>
          ) : queues.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No queues found
            </div>
          ) : (
            <div className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Queue Name</TableHead>
                    <TableHead className="text-right">Waiting</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead className="text-right">Health</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queues.map((queue, idx) => {
                    const failureRate = queue.completed > 0
                      ? (queue.failed / (queue.completed + queue.failed) * 100).toFixed(1)
                      : '0.0'
                    const healthScore = parseFloat(failureRate) < 5 ? 'good' : parseFloat(failureRate) < 15 ? 'warning' : 'bad'

                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium capitalize">
                          {queue.queueName}
                        </TableCell>
                        <TableCell className="text-right">
                          {queue.waiting > 0 ? (
                            <Badge variant="secondary">{queue.waiting}</Badge>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {queue.active > 0 ? (
                            <Badge variant="default">{queue.active}</Badge>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {queue.completed.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {queue.failed > 0 ? (
                            <span className="text-red-600 font-medium">{queue.failed}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              healthScore === 'good' ? 'success' :
                              healthScore === 'warning' ? 'warning' :
                              'destructive'
                            }
                          >
                            {failureRate}% fail
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Visual Progress Bars */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Queue Activity</h4>
                {queues.map((queue, idx) => {
                  const total = queue.waiting + queue.active + queue.completed + queue.failed
                  const waitingPct = total > 0 ? (queue.waiting / total * 100) : 0
                  const activePct = total > 0 ? (queue.active / total * 100) : 0
                  const completedPct = total > 0 ? (queue.completed / total * 100) : 0
                  const failedPct = total > 0 ? (queue.failed / total * 100) : 0

                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium capitalize">{queue.queueName}</span>
                        <span className="text-xs text-gray-500">{total.toLocaleString()} total</span>
                      </div>
                      <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden flex">
                        {waitingPct > 0 && (
                          <div
                            className="bg-yellow-400 flex items-center justify-center text-xs text-white"
                            style={{ width: `${waitingPct}%` }}
                            title={`Waiting: ${queue.waiting}`}
                          />
                        )}
                        {activePct > 0 && (
                          <div
                            className="bg-blue-500 flex items-center justify-center text-xs text-white"
                            style={{ width: `${activePct}%` }}
                            title={`Active: ${queue.active}`}
                          />
                        )}
                        {completedPct > 0 && (
                          <div
                            className="bg-green-500 flex items-center justify-center text-xs text-white"
                            style={{ width: `${completedPct}%` }}
                            title={`Completed: ${queue.completed}`}
                          />
                        )}
                        {failedPct > 0 && (
                          <div
                            className="bg-red-500 flex items-center justify-center text-xs text-white"
                            style={{ width: `${failedPct}%` }}
                            title={`Failed: ${queue.failed}`}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
