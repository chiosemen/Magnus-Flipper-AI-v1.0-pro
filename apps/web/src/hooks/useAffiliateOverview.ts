"use client";

import { useQuery } from "@tanstack/react-query";
import type { AffiliateOverview } from "@magnus-flipper-ai/core/types/affiliate";

/**
 * Hook to fetch affiliate overview data
 */
export function useAffiliateOverview() {
  return useQuery<AffiliateOverview>({
    queryKey: ["affiliate", "overview"],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/affiliate/overview`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch affiliate overview");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
