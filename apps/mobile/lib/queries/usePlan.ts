"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function usePlan() {
  const query = useQuery({
    queryKey: ["plan"],
    queryFn: api.plan.get,
    staleTime: 10_000,
    retry: false,
  });

  return {
    plan: query.data?.plan,
    limits: query.data?.limits,
    usage: query.data?.usage,
    isLoading: query.isLoading,
    error: query.error,
    data: query.data,
  };
}
