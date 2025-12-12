"use client";

import { useQuery } from "@tanstack/react-query";
import type { AffiliateLink, AffiliateMetrics } from "@magnus-flipper-ai/core/types/affiliate";

interface AffiliateLinksResponse {
  links: AffiliateLink[];
  metrics: {
    totalClicks: { label: string; value: string };
    conversionRate: { label: string; value: string };
  };
}

/**
 * Hook to fetch affiliate links
 */
export function useAffiliateLinks() {
  return useQuery<AffiliateLinksResponse>({
    queryKey: ["affiliate", "links"],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/affiliate/links`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch affiliate links");
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}
