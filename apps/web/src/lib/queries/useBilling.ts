'use client';

import { useEffect, useState } from "react";
import type { SubscriptionPlan } from "@magnus-flipper-ai/core";

export interface BillingStatus {
  plan?: SubscriptionPlan;
  status?: string;
  trial_expires_at?: string | null;
  subscription_current_period_end?: string | null;
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getCurrentPlan(): Promise<BillingStatus> {
  const res = await fetch("/api/billing/status", { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function checkout(planId: SubscriptionPlan) {
  return postJson<{ url: string }>("/api/billing/checkout", { planId });
}

export async function openPortal() {
  return postJson<{ url: string }>("/api/billing/portal");
}

export async function startTrial() {
  return postJson<{ plan?: string; trial_expires_at?: string; url?: string }>(
    "/api/billing/mobile/trial-checkout"
  );
}

export function useBilling() {
  const [data, setData] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await getCurrentPlan();
      setData(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (error) return { data: null, loading: false, error, refresh: load, isError: true };

  return { data, loading, error, refresh: load, isError: false };
}
