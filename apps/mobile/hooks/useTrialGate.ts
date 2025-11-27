"use client";

import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useSubscription } from "./useSubscription";

export function useTrialGate() {
  const router = useRouter();
  const { subscription, loading } = useSubscription();

  const gate = (allowed: Array<"active" | "trialing" | "trial_expired" | "none">) => {
    useEffect(() => {
      if (loading) return;
      const status = subscription?.status || "none";
      if (!allowed.includes(status)) {
        router.replace("/onboarding/trial-start");
      }
    }, [allowed, subscription?.status, loading, router]);
  };

  return { gate };
}
