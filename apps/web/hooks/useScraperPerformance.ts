"use client";

import { useQuery } from "@tanstack/react-query";
import type { PerformanceSnapshot, PerformanceSummary } from "@/lib/types/scraper";

interface ScraperPerformanceResponse {
  summary: PerformanceSummary;
  snapshots: PerformanceSnapshot[];
}

/**
 * Hook to fetch scraper performance metrics
 */
export function useScraperPerformance(marketplace?: string, timeWindow: string = "24h") {
  return useQuery<ScraperPerformanceResponse>({
    queryKey: ["scraper", "performance", marketplace, timeWindow],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const params = new URLSearchParams();
      if (marketplace) {
        params.set("marketplace", marketplace);
      }
      params.set("timeWindow", timeWindow);
      const response = await fetch(`${baseUrl}/api/scraper/performance?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch scraper performance");
      }

      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchOnWindowFocus: false,
  });
}
