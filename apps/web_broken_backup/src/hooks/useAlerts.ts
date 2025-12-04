import { useState, useCallback } from 'react';

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  read: boolean;
  created_at: string;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'price_drop',
      title: 'Price Drop Alert',
      message:
        'Similar items in your category have dropped 10% in the past week',
      severity: 'warning',
      read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'trending',
      title: 'Trending Category',
      message: 'Vintage electronics are trending up 15% this month',
      severity: 'info',
      read: false,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const markAsRead = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, read: true })));
  }, []);

  const deleteAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  }, []);

  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'created_at'>) => {
    const newAlert: Alert = {
      ...alert,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
  }, []);

  const unreadCount = alerts.filter((a) => !a.read).length;

  return {
    alerts,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteAlert,
    addAlert,
  };
}
