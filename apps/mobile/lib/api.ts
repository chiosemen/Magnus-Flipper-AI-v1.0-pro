"use client";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";

export interface SavedSearchPayload {
  name: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  radiusMiles?: number;
  keywords?: string[];
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  savedSearches: {
    list: () => apiFetch<any[]>("/api/saved-searches"),
    create: (payload: SavedSearchPayload) =>
      apiFetch<any>("/api/saved-searches", { method: "POST", body: JSON.stringify(payload) }),
  },
  alerts: {
    list: () => apiFetch<any[]>("/api/alerts/recent"),
  },
  listings: {
    list: () => apiFetch<any[]>("/api/listings/feed"),
    detail: (id: string) => apiFetch<any>(`/api/listings/${id}`),
  },
  plan: {
    get: () => apiFetch<any>("/api/plan"),
    checkout: (planId: string) =>
      apiFetch<{ url: string }>("/api/billing/checkout", { method: "POST", body: JSON.stringify({ planId }) }),
    trial: () => apiFetch<{ url: string }>("/api/billing/mobile/trial-checkout", { method: "POST" }),
  },
};
