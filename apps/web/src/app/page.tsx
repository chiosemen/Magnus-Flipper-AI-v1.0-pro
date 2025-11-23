'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAPI } from '@/hooks/use-api'
import { mockDashboardStats, mockRecentListings } from '@/lib/mock-data'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils'
import { TrendingUp, TrendingDown, ShoppingCart, Bell, Target, DollarSign } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'

function StatCard({
  title,
  value,
  change,
  icon: Icon,
}: {
  title: string
  value: string | number
  change: number
  icon: any
}) {
  const isPositive = change >= 0

  return (
    <Card className="neon-glow-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold stat-counter font-mono">{value}</div>
        <div className="mt-2 flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span
            className={`text-sm font-medium ${
              isPositive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {formatPercentage(change)}
          </span>
          <span className="text-sm text-muted-foreground">vs last week</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading, isUsingFallback } = useAPI('/api/stats', {
    fallbackData: mockDashboardStats,
    refreshInterval: 30000,
  })

  const { data: listings } = useAPI('/api/listings/recent', {
    fallbackData: mockRecentListings,
    refreshInterval: 15000,
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening today.
          </p>
        </div>
        {isUsingFallback && (
          <Badge variant="warning">Using Mock Data</Badge>
        )}
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Listings"
            value={formatNumber(stats?.totalListings || 0)}
            change={stats?.listingsChange || 0}
            icon={ShoppingCart}
          />
          <StatCard
            title="Active Alerts"
            value={formatNumber(stats?.activeAlerts || 0)}
            change={stats?.alertsChange || 0}
            icon={Bell}
          />
          <StatCard
            title="Today's Finds"
            value={formatNumber(stats?.todayFinds || 0)}
            change={stats?.findsChange || 0}
            icon={Target}
          />
          <StatCard
            title="Potential Profit"
            value={formatCurrency(stats?.potentialProfit || 0)}
            change={stats?.profitChange || 0}
            icon={DollarSign}
          />
        </div>
      )}

      {/* Recent Listings */}
      <Card className="neon-glow-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-mint" />
            High-Value Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {listings?.map((listing: any) => (
              <div
                key={listing.id}
                className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/30 p-4 transition-all hover:border-cyan-mint/50 hover:bg-muted/50"
              >
                <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-indigo-blue/20 to-cyan-mint/20 flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-cyan-mint" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{listing.title}</h3>
                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{listing.location}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(listing.postedAt))} ago</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">List Price</div>
                  <div className="font-mono text-lg font-bold">
                    {formatCurrency(listing.price)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Market Value</div>
                  <div className="font-mono text-lg font-bold text-cyan-mint">
                    {formatCurrency(listing.marketValue)}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="neon" className="text-base px-4 py-2">
                    +{formatCurrency(listing.profit)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
