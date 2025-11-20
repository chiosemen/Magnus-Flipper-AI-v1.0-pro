'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Sparkles,
  TrendingUp,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Extension {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  tier_required: string;
}

interface MarketInsight {
  id: string;
  type: 'trend' | 'alert' | 'recommendation';
  title: string;
  description: string;
  severity?: 'info' | 'warning' | 'critical';
  created_at: string;
}

export default function ExtensionsPage() {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  useEffect(() => {
    // Initialize extensions
    setExtensions([
      {
        id: '1',
        name: 'AI Valuation',
        description:
          'Get instant AI-powered valuations for your products using market data and ML algorithms',
        icon: Sparkles,
        enabled: true,
        tier_required: 'free',
      },
      {
        id: '2',
        name: 'Market Insights',
        description:
          'Real-time market trends, alerts, and recommendations to optimize your listings',
        icon: TrendingUp,
        enabled: true,
        tier_required: 'basic',
      },
      {
        id: '3',
        name: 'Auto Description Generator',
        description:
          'Generate compelling product descriptions automatically using AI',
        icon: FileText,
        enabled: false,
        tier_required: 'basic',
      },
      {
        id: '4',
        name: 'Smart Pricing',
        description:
          'Dynamic pricing recommendations based on market conditions and competition',
        icon: DollarSign,
        enabled: false,
        tier_required: 'pro',
      },
    ]);

    fetchMarketInsights();
  }, []);

  const fetchMarketInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const response = await fetch('/api/extensions/market-insights');
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleToggleExtension = (extensionId: string) => {
    setExtensions((prev) =>
      prev.map((ext) =>
        ext.id === extensionId ? { ...ext, enabled: !ext.enabled } : ext
      )
    );
    toast.success('Extension updated');
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return TrendingUp;
      case 'alert':
        return AlertCircle;
      case 'recommendation':
        return CheckCircle;
      default:
        return Sparkles;
    }
  };

  const getInsightColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Extensions</h1>
          <p className="text-gray-600 mt-1">
            Enhance your flipping experience with AI-powered tools and
            integrations
          </p>
        </div>

        {/* Extensions Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Available Extensions
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {extensions.map((extension) => {
              const Icon = extension.icon;
              return (
                <Card key={extension.id}>
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <Icon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {extension.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {extension.description}
                          </p>
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                              {extension.tier_required} tier
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant={extension.enabled ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleExtension(extension.id)}
                      >
                        {extension.enabled ? 'Enabled' : 'Enable'}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Market Insights */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Market Insights
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMarketInsights}
              isLoading={isLoadingInsights}
            >
              Refresh
            </Button>
          </div>

          <div className="space-y-4">
            {insights.length === 0 && !isLoadingInsights && (
              <Card>
                <CardBody>
                  <p className="text-gray-600 text-center py-8">
                    No insights available at the moment. Check back later!
                  </p>
                </CardBody>
              </Card>
            )}

            {insights.map((insight) => {
              const Icon = getInsightIcon(insight.type);
              const colorClass = getInsightColor(insight.severity);

              return (
                <Card key={insight.id}>
                  <CardBody>
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {insight.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {insight.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(insight.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
