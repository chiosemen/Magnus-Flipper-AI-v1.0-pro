import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  createApiClient,
  type AlertRecord,
  type AlertsStats as ApiAlertsStats,
  type Listing as ApiListing,
  type SavedSearch as ApiSavedSearch,
} from '@magnus-flipper-ai/api-client';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { env } from './env';

class MagnusAPI {
  private client: AxiosInstance;
  private restClient = createApiClient({
    baseUrl: env.apiUrl,
    getToken: () => SecureStore.getItemAsync('authToken'),
  });

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

  private mapSavedSearch(api: ApiSavedSearch) {
    const createdAt = api.createdAt ?? new Date().toISOString();
    return {
      ...api,
      name: api.category,
      locationCity: api.location,
      createdAt,
    };
  }

  private mapListing(api: ApiListing) {
    const postedAt = api.postedAt ?? new Date().toISOString();
    return {
      ...api,
      site: api.source,
      city: api.location,
      imageUrls: api.image ? [api.image] : [],
      scrapedAt: postedAt,
    };
  }

  private async hydrateAlert(record: AlertRecord) {
    const [listingResult, savedSearchResult] = await Promise.allSettled([
      this.restClient.listings.getById(record.listing_id),
      this.restClient.savedSearches.getById(record.saved_search_id),
    ]);

    return {
      ...record,
      listing: listingResult.status === 'fulfilled' ? this.mapListing(listingResult.value) : undefined,
      savedSearch: savedSearchResult.status === 'fulfilled' ? this.mapSavedSearch(savedSearchResult.value) : undefined,
    };
  }

  private mapAlertsStats(stats: ApiAlertsStats) {
    return {
      unread: stats.totalAlerts ?? 0,
      lastNotifiedAt: stats.lastMatch ?? null,
      totalMatches: stats.totalAlerts ?? 0,
    };
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

  // Saved Searches
  async getSavedSearches(signal?: AbortSignal) {
    const data = await this.restClient.savedSearches.list(signal);
    return data.map((s) => this.mapSavedSearch(s));
  }

  async createSavedSearch(payload: any, signal?: AbortSignal) {
    const data = await this.restClient.savedSearches.create(payload as ApiSavedSearch, signal);
    return this.mapSavedSearch(data);
  }

  async updateSavedSearch(id: string, payload: any, signal?: AbortSignal) {
    const data = await this.restClient.savedSearches.update(id, payload as ApiSavedSearch, signal);
    return this.mapSavedSearch(data);
  }

  async deleteSavedSearch(id: string, signal?: AbortSignal) {
    await this.restClient.savedSearches.remove(id, signal);
  }

  // Listings feed + detail
  async getListingsFeed(params?: Record<string, string | number | undefined>, signal?: AbortSignal) {
    const page = params?.page !== undefined ? Number(params.page) : undefined;
    const limit =
      (params?.pageSize ?? params?.limit) !== undefined ? Number(params?.pageSize ?? params?.limit) : undefined;
    const listings = await this.restClient.listings.feed({ page, limit }, signal);
    const mapped = listings.map((l) => this.mapListing(l));
    const pageSize = limit ?? mapped.length || 0;
    return {
      listings: mapped,
      total: mapped.length,
      page: page ?? 1,
      pageSize,
    };
  }

  async getListing(id: string, signal?: AbortSignal) {
    const data = await this.restClient.listings.getById(id, signal);
    return this.mapListing(data);
  }

  // Alerts
  async getRecentAlerts(signal?: AbortSignal) {
    const data = await this.restClient.alerts.recent(signal);
    return Promise.all(data.map((a) => this.hydrateAlert(a)));
  }

  async getAlertsStats(signal?: AbortSignal) {
    const stats = await this.restClient.alerts.stats(signal);
    return this.mapAlertsStats(stats);
  }

  // Profile API
  async getProfile() {
    const { data } = await this.client.get('/profile');
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
  }) {
    const { data } = await this.client.patch('/profile', updates);
    return data;
  }

  // Subscription API
  async getSubscription() {
    const { data } = await this.client.get('/subscription');
    return data;
  }

  async createCheckoutSession(plan: 'pro' | 'enterprise') {
    const { data } = await this.client.post('/subscription/checkout', { plan });
    return data;
  }

  async cancelSubscription() {
    const { data } = await this.client.post('/subscription/cancel');
    return data;
  }
}

export const api = new MagnusAPI();
export default api;
