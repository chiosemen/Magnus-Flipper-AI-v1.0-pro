'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { DollarSign, Package, TrendingUp, ShoppingCart } from 'lucide-react';

interface DashboardStats {
  total_products: number;
  active_listings: number;
  total_revenue: number;
  total_profit: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_products: 0,
    active_listings: 0,
    total_revenue: 0,
    total_profit: 0,
  });

  useEffect(() => {
    // TODO: Fetch real stats from API
    setStats({
      total_products: 24,
      active_listings: 12,
      total_revenue: 4250.0,
      total_profit: 1340.0,
    });
  }, []);

  const statCards = [
    {
      title: 'Total Products',
      value: stats.total_products,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Listings',
      value: stats.active_listings,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.total_revenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Profit',
      value: `$${stats.total_profit.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's an overview of your flipping business.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardBody className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Recent Products</h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-600">
                Your recently added products will appear here.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Market Insights</h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-600">
                AI-powered market insights and alerts will appear here.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
