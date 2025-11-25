"use client";

type PlanId = "STARTER" | "BASIC" | "PREMIUM" | "ULTRA";

async function postJson<T>(url: string, body?: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function createCheckoutSession(planId: PlanId) {
  return postJson<{ url: string }>("/api/billing/checkout", { planId });
}

export async function openBillingPortal() {
  return postJson<{ url: string }>("/api/billing/portal");
}

export async function startSevenDayTrial() {
  return postJson<{ plan: string; trial_expires_at: string }>("/api/billing/mobile/trial-checkout");
}
