'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function MarketPage() {
  // Mock market data - will be replaced with real data
  const trendingCategories = [
    { name: 'Vintage Electronics', trend: 'up', change: '+15%', volume: 234 },
    { name: 'Designer Handbags', trend: 'up', change: '+12%', volume: 189 },
    { name: 'Collectible Toys', trend: 'down', change: '-5%', volume: 156 },
    { name: 'Vintage Watches', trend: 'up', change: '+8%', volume: 98 },
  ];

  const marketInsights = [
    {
      category: 'Electronics',
      insight: 'Vintage gaming consoles seeing 20% price increase this month',
      date: '2 hours ago',
    },
    {
      category: 'Fashion',
      insight: 'Designer bags from 90s brands trending on social media',
      date: '5 hours ago',
    },
    {
      category: 'Collectibles',
      insight: 'Limited edition sneakers reaching all-time high prices',
      date: '1 day ago',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Market Trends</h1>
          <p className="text-gray-600 mt-1">
            Real-time market insights and trending categories
          </p>
        </div>

        {/* Trending Categories */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Trending Categories
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {trendingCategories.map((category) => (
              <Card key={category.name}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {category.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {category.volume}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Active listings
                      </p>
                    </div>
                    <div
                      className={`flex items-center ${
                        category.trend === 'up'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {category.trend === 'up' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                      <span className="ml-1 text-sm font-semibold">
                        {category.change}
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* Market Insights */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Latest Insights
          </h2>
          <div className="space-y-4">
            {marketInsights.map((insight, index) => (
              <Card key={index}>
                <CardBody>
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {insight.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {insight.date}
                        </span>
                      </div>
                      <p className="text-gray-900 mt-2">{insight.insight}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
