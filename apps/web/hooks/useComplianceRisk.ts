"use client";

import { useQuery } from "@tanstack/react-query";
import type { MarketplaceRisk, ComplianceSummary } from "@/lib/types/compliance";

interface ComplianceRiskResponse {
  summary: ComplianceSummary;
  marketplaceRisks: MarketplaceRisk[];
}

/**
 * Hook to fetch compliance risk scores
 */
export function useComplianceRisk(marketplace?: string) {
  return useQuery<ComplianceRiskResponse>({
    queryKey: ["compliance", "risk-scores", marketplace],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const params = new URLSearchParams();
      if (marketplace) {
        params.set("marketplace", marketplace);
      }
      const response = await fetch(`${baseUrl}/api/compliance/risk-scores?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch compliance risk scores");
      }

      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchOnWindowFocus: false,
  });
}
