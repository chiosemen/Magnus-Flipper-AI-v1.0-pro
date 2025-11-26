"use client";

import type { SubscriptionPlan } from "@magnus-flipper-ai/core";

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

export function startCheckout(planId: SubscriptionPlan) {
  return postJson<{ url: string }>("/api/billing/checkout", { planId });
}

export function openCustomerPortal() {
  return postJson<{ url: string }>("/api/billing/portal");
}
