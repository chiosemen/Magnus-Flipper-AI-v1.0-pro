import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { env } from './env';

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
