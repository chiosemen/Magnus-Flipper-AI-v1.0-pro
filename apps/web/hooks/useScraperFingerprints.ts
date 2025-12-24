"use client";

import { useQuery } from "@tanstack/react-query";
import type { FingerprintStats } from "@/lib/types/scraper";

interface ScraperFingerprintsResponse {
  fingerprints: FingerprintStats | FingerprintStats[];
}

/**
 * Hook to fetch scraper fingerprint statistics
 */
export function useScraperFingerprints(marketplace?: string, timeWindow: string = "24h") {
  return useQuery<ScraperFingerprintsResponse>({
    queryKey: ["scraper", "fingerprints", marketplace, timeWindow],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const params = new URLSearchParams();
      if (marketplace) {
        params.set("marketplace", marketplace);
      }
      params.set("timeWindow", timeWindow);
      const response = await fetch(`${baseUrl}/api/scraper/fingerprints?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch scraper fingerprints");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    refetchOnWindowFocus: false,
  });
}
