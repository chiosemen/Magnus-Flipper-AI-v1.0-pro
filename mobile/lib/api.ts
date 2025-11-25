import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { env } from './env';
import type {
  SavedSearch,
  Listing,
  ListingsFeedRequest,
  ListingsFeedResponse,
  CreateSavedSearchRequest,
  UpdateSavedSearchRequest,
  AlertsRecentResponse,
  User,
  SubscriptionPlan,
  PlanLimits,
} from '@magnus-flipper-ai/core';

class MagnusAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - clear auth
          await SecureStore.deleteItemAsync('authToken');
          // You can emit an event here to redirect to login
        }
        return Promise.reject(error);
      }
    );
  }

  // Deals API
  async getDeals(params?: {
    limit?: number;
    offset?: number;
    minScore?: number;
    category?: string;
  }) {
    const { data } = await this.client.get('/deals', { params });
    return data;
  }

  async getDeal(id: string) {
    const { data } = await this.client.get(`/deals/${id}`);
    return data;
  }

  // Watchlists API
  async getWatchlists() {
    const { data } = await this.client.get('/watchlists');
    return data;
  }

  async createWatchlist(watchlist: {
    name: string;
    keywords: string[];
    minPrice?: number;
    maxPrice?: number;
    minScore?: number;
    categories?: string[];
  }) {
    const { data } = await this.client.post('/watchlists', watchlist);
    return data;
  }

  async updateWatchlist(id: string, updates: Partial<{
    name: string;
    keywords: string[];
    minPrice?: number;
    maxPrice?: number;
    minScore?: number;
    categories?: string[];
  }>) {
    const { data } = await this.client.patch(`/watchlists/${id}`, updates);
    return data;
  }

  async deleteWatchlist(id: string) {
    await this.client.delete(`/watchlists/${id}`);
  }

  // Alerts API
  async getAlerts(params?: {
    limit?: number;
    offset?: number;
    status?: 'pending' | 'sent' | 'failed';
  }) {
    const { data } = await this.client.get('/alerts', { params });
    return data;
  }

  async markAlertAsRead(id: string) {
    const { data } = await this.client.patch(`/alerts/${id}`, { status: 'read' });
    return data;
  }

  async deleteAlert(id: string) {
    await this.client.delete(`/alerts/${id}`);
  }

  // Push Notifications
  async registerPushToken(token: string, deviceId: string) {
    const { data } = await this.client.post('/alerts/push/register', {
      token,
      deviceId,
      platform: Constants.platform?.ios ? 'ios' : 'android',
    });
    return data;
  }

  async unregisterPushToken(deviceId: string) {
    await this.client.post('/alerts/push/unregister', { deviceId });
  }

  // Saved Searches (typed with @magnus-flipper-ai/core)
  async getSavedSearches(): Promise<SavedSearch[]> {
    const { data } = await this.client.get<SavedSearch[]>('/api/saved-searches');
    return data;
  }

  async createSavedSearch(payload: CreateSavedSearchRequest): Promise<SavedSearch> {
    const { data } = await this.client.post<SavedSearch>('/api/saved-searches', payload);
    return data;
  }

  async updateSavedSearch(id: string, payload: UpdateSavedSearchRequest): Promise<SavedSearch> {
    const { data } = await this.client.patch<SavedSearch>(`/api/saved-searches/${id}`, payload);
    return data;
  }

  async deleteSavedSearch(id: string): Promise<void> {
    await this.client.delete(`/api/saved-searches/${id}`);
  }

  // Listings feed + detail (typed with @magnus-flipper-ai/core)
  async getListingsFeed(params?: Partial<ListingsFeedRequest>): Promise<ListingsFeedResponse> {
    const { data } = await this.client.get<ListingsFeedResponse>('/api/listings/feed', { params });
    return data;
  }

  async getListing(id: string): Promise<Listing> {
    const { data } = await this.client.get<Listing>(`/api/listings/${id}`);
    return data;
  }

  // Alerts (typed with @magnus-flipper-ai/core)
  async getRecentAlerts(): Promise<AlertsRecentResponse> {
    const { data } = await this.client.get<AlertsRecentResponse>('/api/alerts/recent');
    return data;
  }

  async getAlertsStats(): Promise<{ total: number; unread: number }> {
    const { data } = await this.client.get('/api/alerts/stats');
    return data;
  }

  // Profile API (typed with @magnus-flipper-ai/core)
  async getProfile(): Promise<User> {
    const { data } = await this.client.get<User>('/profile');
    return data;
  }

  async updateProfile(updates: {
    email?: string;
    phone?: string;
    notificationPreferences?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
  }): Promise<User> {
    const { data } = await this.client.patch<User>('/profile', updates);
    return data;
  }

  // Plan & Subscription API (typed with @magnus-flipper-ai/core)
  async getPlan(): Promise<{ plan: SubscriptionPlan; limits: PlanLimits }> {
    const { data } = await this.client.get<{ plan: SubscriptionPlan; limits: PlanLimits }>('/api/plan');
    return data;
  }

  async getSubscription(): Promise<{
    plan: SubscriptionPlan;
    status: 'active' | 'trialing' | 'past_due' | 'canceled';
    currentPeriodEnd?: string;
  }> {
    const { data } = await this.client.get('/subscription');
    return data;
  }

  async createCheckoutSession(plan: 'pro' | 'enterprise'): Promise<{ sessionUrl: string }> {
    const { data } = await this.client.post('/subscription/checkout', { plan });
    return data;
  }

  async cancelSubscription(): Promise<void> {
    await this.client.post('/subscription/cancel');
  }

  // Trial & Billing API (mobile-specific)
  async createTrialCheckout(): Promise<{ sessionUrl: string; clientSecret?: string }> {
    const { data } = await this.client.post<{ sessionUrl: string; clientSecret?: string }>(
      '/api/billing/mobile/trial-checkout'
    );
    return data;
  }

  async getBillingPortalUrl(): Promise<{ portalUrl: string }> {
    const { data } = await this.client.get<{ portalUrl: string }>('/api/billing/portal');
    return data;
  }
}

export const api = new MagnusAPI();
export default api;
