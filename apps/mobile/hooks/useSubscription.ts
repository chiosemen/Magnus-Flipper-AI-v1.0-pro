"use client";

import { useEffect, useState, useCallback } from "react";
import { api, SubscriptionPayload } from "@/lib/api";

export function useSubscription() {
  const [data, setData] = useState<SubscriptionPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.subscription.getMobile();
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { subscription: data, loading, error, refresh };
}
