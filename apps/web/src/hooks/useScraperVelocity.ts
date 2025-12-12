"use client";

import { useQuery } from "@tanstack/react-query";
import type { VelocityMetrics } from "@magnus-flipper-ai/core/types/scraper";

interface ScraperVelocityResponse {
  velocity: VelocityMetrics | VelocityMetrics[];
}

/**
 * Hook to fetch scraper velocity metrics
 */
export function useScraperVelocity(marketplace?: string, timeWindow: string = "24h") {
  return useQuery<ScraperVelocityResponse>({
    queryKey: ["scraper", "velocity", marketplace, timeWindow],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const params = new URLSearchParams();
      if (marketplace) {
        params.set("marketplace", marketplace);
      }
      params.set("timeWindow", timeWindow);
      const response = await fetch(`${baseUrl}/api/scraper/velocity?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch scraper velocity");
      }

      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: false,
  });
}
