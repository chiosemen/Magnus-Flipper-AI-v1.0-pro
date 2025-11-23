'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getCrawlerStatus, CrawlerStatus } from '@/lib/api'
import { formatRelativeTime } from '@/lib/utils'
import { Activity, RefreshCw, CheckCircle, XCircle, Pause } from 'lucide-react'

export default function CrawlerPage() {
  const [crawlers, setCrawlers] = useState<CrawlerStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)

  const fetchCrawlers = async () => {
    setLoading(true)
    const result = await getCrawlerStatus()
    if (result.data) {
      setCrawlers(result.data)
      setUsingMock(result.usedMock || false)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCrawlers()
    const interval = setInterval(fetchCrawlers, 15000)
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: CrawlerStatus['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="success">Running</Badge>
      case 'stopped':
        return <Badge variant="secondary">Stopped</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
    }
  }

  const getStatusIcon = (status: CrawlerStatus['status']) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'stopped':
        return <Pause className="w-5 h-5 text-gray-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
    }
  }

  const totalItemsCrawled = crawlers.reduce((sum, c) => sum + c.itemsCrawled, 0)
  const totalErrors = crawlers.reduce((sum, c) => sum + c.errors, 0)
  const runningCount = crawlers.filter(c => c.status === 'running').length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crawler Status</h1>
          <p className="mt-2 text-sm text-gray-600">
            {runningCount} of {crawlers.length} crawlers running
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {usingMock && <Badge variant="warning">Mock Data</Badge>}
          <Button onClick={fetchCrawlers} disabled={loading} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItemsCrawled.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Items crawled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Crawlers</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningCount}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalErrors}</div>
            <p className="text-xs text-muted-foreground">Errors encountered</p>
          </CardContent>
        </Card>
      </div>

      {/* Crawler List */}
      <Card>
        <CardHeader>
          <CardTitle>Crawler Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && crawlers.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-gray-600">Loading crawlers...</p>
            </div>
          ) : crawlers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No crawlers found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crawler</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Items Crawled</TableHead>
                  <TableHead>Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crawlers.map((crawler, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(crawler.status)}
                        <span className="font-medium">{crawler.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(crawler.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatRelativeTime(crawler.lastRun)}
                    </TableCell>
                    <TableCell>{crawler.itemsCrawled.toLocaleString()}</TableCell>
                    <TableCell>
                      {crawler.errors > 0 ? (
                        <span className="text-red-600 font-medium">{crawler.errors}</span>
                      ) : (
                        <span className="text-gray-500">0</span>
                      )}
                    </TableCell>
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
