"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import type { GuardrailStatus } from "@/lib/types/compliance";

interface GuardrailsResponse {
  guardrails: GuardrailStatus | GuardrailStatus[];
}

interface ValidateGuardrailRequest {
  marketplace: string;
  multiplier: number;
  successRate: number;
  metrics?: Record<string, any>;
  isEmergencyMode?: boolean;
}

/**
 * Hook to fetch compliance guardrails
 */
export function useComplianceGuardrails(marketplace?: string, proposedMultiplier?: number, successRate?: number) {
  return useQuery<GuardrailsResponse>({
    queryKey: ["compliance", "guardrails", marketplace, proposedMultiplier, successRate],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const params = new URLSearchParams();
      if (marketplace) {
        params.set("marketplace", marketplace);
      }
      if (proposedMultiplier !== undefined) {
        params.set("multiplier", proposedMultiplier.toString());
      }
      if (successRate !== undefined) {
        params.set("successRate", successRate.toString());
      }
      const response = await fetch(`${baseUrl}/api/compliance/guardrails?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch compliance guardrails");
      }

      return response.json();
    },
    enabled: !!marketplace || proposedMultiplier === undefined, // Only fetch if marketplace provided or no validation needed
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to validate a throttle multiplier
 */
export function useValidateGuardrail() {
  return useMutation({
    mutationFn: async (data: ValidateGuardrailRequest) => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/compliance/guardrails/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to validate guardrail");
      }

      return response.json();
    },
  });
}
