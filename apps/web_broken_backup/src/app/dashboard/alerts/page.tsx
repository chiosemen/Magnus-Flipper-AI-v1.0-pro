'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Bell, BellOff, TrendingUp, AlertCircle, Info } from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([
    {
      id: '1',
      type: 'price_drop',
      title: 'Price Drop Alert',
      message:
        'Similar items in your category have dropped 10% in the past week',
      severity: 'warning',
      read: false,
      created_at: '2 hours ago',
    },
    {
      id: '2',
      type: 'trending',
      title: 'Trending Category',
      message: 'Vintage electronics are trending up 15% this month',
      severity: 'info',
      read: false,
      created_at: '5 hours ago',
    },
    {
      id: '3',
      type: 'recommendation',
      title: 'Listing Recommendation',
      message: 'Best time to list your items is this weekend based on data',
      severity: 'info',
      read: true,
      created_at: '1 day ago',
    },
    {
      id: '4',
      type: 'market',
      title: 'Market Opportunity',
      message: 'Low competition detected in Designer Handbags category',
      severity: 'info',
      read: true,
      created_at: '2 days ago',
    },
  ]);

  const markAsRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, read: true })));
  };

  const deleteAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case 'price_drop':
        return <AlertCircle className="w-5 h-5" />;
      case 'trending':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'warning':
        return 'text-orange-600 bg-orange-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
            <p className="text-gray-600 mt-1">
              Stay updated with market changes and opportunities
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {unreadCount} new
                </span>
              )}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {/* Alert Settings */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Alert Preferences</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Price Alerts</p>
                  <p className="text-sm text-gray-600">
                    Get notified when prices change in your categories
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Trending Categories</p>
                  <p className="text-sm text-gray-600">
                    Get notified about trending product categories
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Market Opportunities</p>
                  <p className="text-sm text-gray-600">
                    Get notified about market gaps and opportunities
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Alerts List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Alerts
          </h2>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <Card>
                <CardBody className="text-center py-12">
                  <BellOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No alerts yet</p>
                </CardBody>
              </Card>
            ) : (
              alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={!alert.read ? 'ring-2 ring-blue-500' : ''}
                >
                  <CardBody>
                    <div className="flex items-start space-x-4">
                      <div
                        className={`p-2 rounded-lg ${getAlertColor(
                          alert.severity
                        )}`}
                      >
                        {getAlertIcon(alert.type, alert.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {alert.title}
                              {!alert.read && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  New
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {alert.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {alert.created_at}
                            </p>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            {!alert.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(alert.id)}
                              >
                                Mark read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAlert(alert.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
