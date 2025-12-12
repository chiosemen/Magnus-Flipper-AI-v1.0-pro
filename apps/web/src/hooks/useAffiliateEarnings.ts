"use client";

import { useQuery } from "@tanstack/react-query";
import type { EarningsPeriod, EarningsDataPoint, AffiliateMetrics } from "@magnus-flipper-ai/core/types/affiliate";

interface AffiliateEarningsResponse {
  earningsData: EarningsDataPoint[];
  metrics: Array<{
    label: string;
    value: string;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
  }>;
  topPerformers?: {
    links: Array<{
      link: any;
      revenue: number;
      clicks: number;
      conversionRate: number;
    }>;
  };
}

/**
 * Hook to fetch affiliate earnings data
 */
export function useAffiliateEarnings(period: EarningsPeriod = "7d") {
  return useQuery<AffiliateEarningsResponse>({
    queryKey: ["affiliate", "earnings", period],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/affiliate/earnings?period=${period}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch affiliate earnings");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
