"use client";

import { useEffect, useState, useCallback } from "react";
import { api, Alert, AlertStats } from "../lib/api";

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [alertsRes, statsRes] = await Promise.all([api.alerts.recent(), api.alerts.stats()]);
      setAlerts(alertsRes);
      setStats(statsRes);
    } catch (err: any) {
      setError(err?.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { alerts, stats, loading, error, refresh };
}
