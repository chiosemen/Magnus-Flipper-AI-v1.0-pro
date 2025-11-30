/**
 * Analytics Dashboard Page
 * Comprehensive analytics with real-time updates, price trends, competitor analysis,
 * conversion metrics, and search performance
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  useActivityFeed,
  usePriceTrends,
  useCompetitorAnalysis,
  useConversionMetrics,
  useSearchPerformance,
} from '@/hooks/analytics';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  Target,
  BarChart3,
  RefreshCw,
  Search,
} from 'lucide-react';

const MARKETPLACES = ['VINTED', 'EBAY', 'GUMTREE', 'CRAIGSLIST', 'OFFERUP', 'FB_MARKETPLACE'];

export default function AnalyticsPage() {
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [competitorQuery, setCompetitorQuery] = useState('');

  // Real-time activity feed
  const { activities, summary: activitySummary, loading: activityLoading, refresh: refreshActivity } = useActivityFeed({
    marketplace: selectedMarketplace || undefined,
    limit: 20,
    realtimeEnabled: true,
  });

  // Price trends
  const { trends, summary: priceSummary, loading: trendsLoading, refresh: refreshTrends } = usePriceTrends({
    marketplace: selectedMarketplace || undefined,
    days: 30,
    sortBy: 'biggest_drop',
    limit: 10,
  });

  // Competitor analysis
  const { comparison, summary: compSummary, loading: compLoading, refresh: refreshComparison } = useCompetitorAnalysis({
    query: competitorQuery || undefined,
    days: 7,
  });

  // Conversion metrics
  const { analysis: conversionAnalysis, summary: conversionSummary, loading: conversionLoading, refresh: refreshConversion } = useConversionMetrics({
    marketplace: selectedMarketplace || undefined,
    days: 30,
    groupBy: 'marketplace',
  });

  // Search performance
  const { analysis: performanceAnalysis, summary: perfSummary, loading: perfLoading, refresh: refreshPerformance } = useSearchPerformance({
    marketplace: selectedMarketplace || undefined,
    days: 7,
    sortBy: 'most_reliable',
  });

  const refreshAll = () => {
    refreshActivity();
    refreshTrends();
    refreshConversion();
    refreshPerformance();
    if (competitorQuery) refreshComparison();
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time insights across all marketplaces
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Marketplaces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Marketplaces</SelectItem>
              {MARKETPLACES.map((mp) => (
                <SelectItem key={mp} value={mp}>
                  {mp.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={refreshAll} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activitySummary.totalActivities}</div>
            <p className="text-xs text-muted-foreground">
              {activitySummary.priceDrops} price drops • {activitySummary.newListings} new
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Trends</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{priceSummary.totalListingsTracked}</div>
            <p className="text-xs text-muted-foreground">
              Avg change: {priceSummary.averagePriceChange?.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversionSummary.bestPerformingMarketplace?.conversionFunnel.overallConversionRate?.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Best: {conversionSummary.bestPerformingMarketplace?.marketplace}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Search Performance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{perfSummary.overallSuccessRate?.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Avg: {perfSummary.avgExecutionTime}ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="realtime">Real-time Feed</TabsTrigger>
          <TabsTrigger value="price-trends">Price Trends</TabsTrigger>
          <TabsTrigger value="competitor">Competitor Analysis</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Metrics</TabsTrigger>
          <TabsTrigger value="performance">Search Performance</TabsTrigger>
        </TabsList>

        {/* Real-time Activity Feed */}
        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Activity Feed</CardTitle>
              <CardDescription>Real-time marketplace updates via WebSocket</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading activities...</div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No recent activities</div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {activity.type === 'PRICE_DROP' && <TrendingDown className="h-5 w-5 text-green-500" />}
                        {activity.type === 'PRICE_INCREASE' && <TrendingUp className="h-5 w-5 text-red-500" />}
                        {activity.type === 'NEW_LISTING' && <Activity className="h-5 w-5 text-blue-500" />}
                        {activity.type === 'SEARCH_MATCH' && <Search className="h-5 w-5 text-purple-500" />}
                        {activity.type === 'ALERT_TRIGGERED' && <Zap className="h-5 w-5 text-yellow-500" />}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{activity.marketplace}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="font-medium truncate">{activity.title}</h4>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Price Trends */}
        <TabsContent value="price-trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Price Trend Analysis</CardTitle>
              <CardDescription>Track price changes over time (Last 30 days)</CardDescription>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading trends...</div>
              ) : trends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No price trends available</div>
              ) : (
                <div className="space-y-4">
                  {/* Biggest Drop */}
                  {priceSummary.biggestDrop && (
                    <div className="p-4 border-2 border-green-500/20 rounded-lg bg-green-50 dark:bg-green-950">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-5 w-5 text-green-500" />
                        <h3 className="font-semibold">Biggest Price Drop</h3>
                      </div>
                      <p className="font-medium">{priceSummary.biggestDrop.title}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          {priceSummary.biggestDrop.totalPriceChangePercent?.toFixed(1)}% off
                        </span>
                        <span>
                          ${priceSummary.biggestDrop.currentPrice} (was ${priceSummary.biggestDrop.currentPrice - priceSummary.biggestDrop.totalPriceChange})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Trends List */}
                  <div className="space-y-2">
                    {trends.map((trend) => (
                      <div key={`${trend.marketplace}-${trend.externalId}`} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{trend.marketplace}</Badge>
                            </div>
                            <h4 className="font-medium truncate">{trend.title}</h4>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold">${trend.currentPrice}</div>
                            <div className={`text-sm font-medium ${
                              trend.totalPriceChangePercent < 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {trend.totalPriceChangePercent > 0 ? '+' : ''}
                              {trend.totalPriceChangePercent?.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Range: ${trend.lowestPrice} - ${trend.highestPrice}</span>
                          <span>Avg: ${trend.averagePrice?.toFixed(2)}</span>
                          <span>{trend.priceChangesCount} changes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitor Analysis */}
        <TabsContent value="competitor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Analysis</CardTitle>
              <CardDescription>Compare pricing across marketplaces</CardDescription>
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Search for items to compare..."
                  value={competitorQuery}
                  onChange={(e) => setCompetitorQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && refreshComparison()}
                />
                <Button onClick={refreshComparison}>Compare</Button>
              </div>
            </CardHeader>
            <CardContent>
              {compLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading comparison...</div>
              ) : comparison.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Enter a search query to compare prices across marketplaces
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Best Deals */}
                  <div>
                    <h3 className="font-semibold mb-3">Top Deals Across All Marketplaces</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {compSummary.bestDeals?.slice(0, 6).map((deal, idx) => (
                        <div key={idx} className="p-3 border rounded-lg flex justify-between items-center">
                          <div className="flex-grow min-w-0">
                            <Badge variant="outline" className="mb-1">{deal.marketplace}</Badge>
                            <p className="font-medium truncate text-sm">{deal.title}</p>
                          </div>
                          <div className="text-lg font-bold ml-3">${deal.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Marketplace Comparison */}
                  <div>
                    <h3 className="font-semibold mb-3">Marketplace Comparison</h3>
                    <div className="space-y-3">
                      {comparison.map((mp) => (
                        <div key={mp.marketplace} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{mp.marketplace}</h4>
                              <p className="text-sm text-muted-foreground">{mp.totalListings} listings</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">${mp.averagePrice?.toFixed(2)}</div>
                              <p className="text-xs text-muted-foreground">avg price</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Lowest</p>
                              <p className="font-medium">${mp.lowestPrice}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Median</p>
                              <p className="font-medium">${mp.medianPrice?.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Highest</p>
                              <p className="font-medium">${mp.highestPrice}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Metrics */}
        <TabsContent value="conversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Metrics</CardTitle>
              <CardDescription>Track user engagement and conversion funnel (Last 30 days)</CardDescription>
            </CardHeader>
            <CardContent>
              {conversionLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading metrics...</div>
              ) : conversionAnalysis.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No conversion data available</div>
              ) : (
                <div className="space-y-4">
                  {conversionAnalysis.map((analysis) => (
                    <div key={analysis.group} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold">{analysis.marketplace}</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysis.uniqueListings} listings • {analysis.uniqueUsers} users
                          </p>
                        </div>
                        <Badge variant="outline">
                          {analysis.conversionFunnel.overallConversionRate?.toFixed(1)}% conversion
                        </Badge>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-5 gap-2 mb-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{analysis.metrics.views}</p>
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{analysis.metrics.clicks}</p>
                          <p className="text-xs text-muted-foreground">Clicks</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{analysis.metrics.favorites}</p>
                          <p className="text-xs text-muted-foreground">Favorites</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{analysis.metrics.contacts}</p>
                          <p className="text-xs text-muted-foreground">Contacts</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{analysis.metrics.purchases}</p>
                          <p className="text-xs text-muted-foreground">Purchases</p>
                        </div>
                      </div>

                      {/* Funnel Rates */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Click-through Rate:</span>
                          <span className="font-medium ml-2">{analysis.conversionFunnel.clickThroughRate}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Contact Rate:</span>
                          <span className="font-medium ml-2">{analysis.conversionFunnel.contactRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Performance Analytics</CardTitle>
              <CardDescription>Query speed, success rate, and error analytics (Last 7 days)</CardDescription>
            </CardHeader>
            <CardContent>
              {perfLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading performance data...</div>
              ) : performanceAnalysis.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No performance data available</div>
              ) : (
                <div className="space-y-4">
                  {/* Performance Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-green-500" />
                        <p className="text-sm font-medium">Fastest</p>
                      </div>
                      <p className="text-xl font-bold">{perfSummary.fastestMarketplace?.marketplace}</p>
                      <p className="text-sm text-muted-foreground">{perfSummary.fastestMarketplace?.avgExecutionTime}ms</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <p className="text-sm font-medium">Slowest</p>
                      </div>
                      <p className="text-xl font-bold">{perfSummary.slowestMarketplace?.marketplace}</p>
                      <p className="text-sm text-muted-foreground">{perfSummary.slowestMarketplace?.avgExecutionTime}ms</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        <p className="text-sm font-medium">Most Reliable</p>
                      </div>
                      <p className="text-xl font-bold">{perfSummary.mostReliableMarketplace?.marketplace}</p>
                      <p className="text-sm text-muted-foreground">{perfSummary.mostReliableMarketplace?.successRate}%</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Total Searches</p>
                      </div>
                      <p className="text-xl font-bold">{perfSummary.totalSearches}</p>
                      <p className="text-sm text-muted-foreground">{perfSummary.overallSuccessRate?.toFixed(1)}% success</p>
                    </div>
                  </div>

                  {/* Detailed Performance */}
                  <div className="space-y-3">
                    {performanceAnalysis.map((perf) => (
                      <div key={perf.marketplace} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{perf.marketplace}</h4>
                            <p className="text-sm text-muted-foreground">
                              {perf.totalExecutions} executions • {perf.successRate}% success rate
                            </p>
                          </div>
                          <Badge variant={perf.successRate >= 95 ? 'default' : 'destructive'}>
                            {perf.successRate >= 95 ? 'Healthy' : 'Issues'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Avg Time</p>
                            <p className="font-medium">{perf.avgExecutionTime}ms</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Median</p>
                            <p className="font-medium">{perf.medianExecutionTime}ms</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Avg Results</p>
                            <p className="font-medium">{perf.avgResultsPerSearch?.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Failed</p>
                            <p className="font-medium text-red-600">{perf.failedExecutions}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
