"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAlerts() {
  const query = useQuery({
    queryKey: ["alerts"],
    queryFn: api.alerts.list,
    staleTime: 10_000,
    retry: false,
  });

  return {
    alerts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
