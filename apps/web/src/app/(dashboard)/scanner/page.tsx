'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getMarketplaceDeals, MarketplaceDeal } from '@/lib/api'
import { formatRelativeTime } from '@/lib/utils'
import { ExternalLink, RefreshCw, TrendingUp } from 'lucide-react'

export default function ScannerPage() {
  const [deals, setDeals] = useState<MarketplaceDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)

  const fetchDeals = async () => {
    setLoading(true)
    const result = await getMarketplaceDeals()
    if (result.data) {
      setDeals(result.data)
      setUsingMock(result.usedMock || false)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDeals()
    const interval = setInterval(fetchDeals, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: MarketplaceDeal['status']) => {
    switch (status) {
      case 'new':
        return <Badge variant="success">New</Badge>
      case 'analyzing':
        return <Badge variant="warning">Analyzing</Badge>
      case 'verified':
        return <Badge variant="default">Verified</Badge>
      case 'sold':
        return <Badge variant="secondary">Sold</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace Scanner</h1>
          <p className="mt-2 text-sm text-gray-600">
            Browse and analyze deals from various marketplaces
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {usingMock && <Badge variant="warning">Mock Data</Badge>}
          <Button onClick={fetchDeals} disabled={loading} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Deals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && deals.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-gray-600">Loading deals...</p>
            </div>
          ) : deals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No deals found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Detected</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {deal.title}
                    </TableCell>
                    <TableCell>{deal.marketplace}</TableCell>
                    <TableCell>${deal.price.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      +${deal.estimatedProfit.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                        {deal.profitMargin.toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatRelativeTime(deal.detectedAt)}
                    </TableCell>
                    <TableCell>{getStatusBadge(deal.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(deal.url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
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
