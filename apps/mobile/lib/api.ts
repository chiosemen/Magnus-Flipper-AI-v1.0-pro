"use client";

import type { SavedSearch as CoreSavedSearch } from "@magnus-flipper-ai/core/types";

// Lightweight mobile API client placeholders. Wire to real endpoints when available.
// Base URL can be set via EXPO_PUBLIC_API_URL.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.flipperagents.com";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

async function request<T>(path: string, method: HttpMethod = "GET", body?: any): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface SavedSearchInput {
  name: string;
  category?: string;
  manufacturer?: string;
  models?: string[];
  minPrice?: number;
  maxPrice?: number;
  radiusKm?: number;
  condition?: string;
}

export type SavedSearch = CoreSavedSearch;

export interface Listing {
  id: string;
  title: string;
  price: number;
  site?: string;
  url?: string;
  location?: string;
  description?: string;
  condition?: string;
  imageUrl?: string;
  postedAt?: string;
}

export interface ListingPage {
  items: Listing[];
  nextPage?: number | null;
}

export interface Alert {
  id: string;
  saved_search_id: string;
  listing_id: string;
  created_at: string;
  notified: boolean;
}

export interface AlertStats {
  unread: number;
  total: number;
}

export interface SubscriptionPayload {
  status: "active" | "trialing" | "trial_expired" | "none";
  trialEndsAt?: string;
}

export interface MobileTrialResponse {
  checkoutUrl: string;
}

export const api = {
  savedSearches: {
    list: () => request<SavedSearch[]>("/saved-searches"),
    get: (id: string) => request<SavedSearch>(`/saved-searches/${id}`),
    create: (payload: SavedSearchInput) => request<SavedSearch>("/saved-searches", "POST", payload),
    update: (id: string, payload: Partial<SavedSearchInput>) =>
      request<SavedSearch>(`/saved-searches/${id}`, "PATCH", payload),
    delete: (id: string) => request<void>(`/saved-searches/${id}`, "DELETE"),
  },
  listings: {
    list: (params: { page?: number; pageSize?: number; category?: string; minPrice?: number; maxPrice?: number; condition?: string } = {}) => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", String(params.page));
      if (params.pageSize) query.append("pageSize", String(params.pageSize));
      if (params.category) query.append("category", params.category);
      if (params.minPrice !== undefined) query.append("minPrice", String(params.minPrice));
      if (params.maxPrice !== undefined) query.append("maxPrice", String(params.maxPrice));
      if (params.condition) query.append("condition", params.condition);
      const qs = query.toString();
      return request<ListingPage>(`/listings${qs ? `?${qs}` : ""}`);
    },
    detail: (id: string) => request<Listing>(`/listings/${id}`),
  },
  alerts: {
    recent: () => request<Alert[]>("/api/alerts/recent"),
    stats: () => request<AlertStats>("/api/alerts/stats"),
  },
  subscription: {
    getMobile: () => request<SubscriptionPayload>("/billing/mobile/subscription"),
    startMobileTrial: () => request<MobileTrialResponse>("/billing/mobile/start-trial", "POST"),
  },
};
