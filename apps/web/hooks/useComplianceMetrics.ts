"use client";

import { useQuery } from "@tanstack/react-query";
import type { ComplianceSnapshot } from "@/lib/types/compliance";

interface ComplianceMetricsResponse {
  snapshots: ComplianceSnapshot | ComplianceSnapshot[];
}

/**
 * Hook to fetch compliance metrics
 */
export function useComplianceMetrics(marketplace?: string) {
  return useQuery<ComplianceMetricsResponse>({
    queryKey: ["compliance", "metrics", marketplace],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const params = new URLSearchParams();
      if (marketplace) {
        params.set("marketplace", marketplace);
      }
      const response = await fetch(`${baseUrl}/api/compliance/metrics?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch compliance metrics");
      }

      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchOnWindowFocus: false,
  });
}
