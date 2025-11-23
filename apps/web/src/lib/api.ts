// API client with automatic environment detection and fallback to mock data

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  usedMock?: boolean;
}

async function fetchWithFallback<T>(
  endpoint: string,
  mockData: T,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      console.warn(`API request failed: ${endpoint}, using mock data`);
      return { data: mockData, usedMock: true };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.warn(`API request error: ${endpoint}, using mock data`, error);
    return { data: mockData, usedMock: true };
  }
}

// Health check
export async function checkHealth() {
  return fetchWithFallback('/health', {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'magnus-flipper-api',
    version: '1.0.0',
  });
}

// Dashboard stats
export interface DashboardStats {
  totalDeals: number;
  activeAlerts: number;
  crawlerStatus: 'running' | 'stopped' | 'error';
  queueSize: number;
  profitToday: number;
  dealsToday: number;
}

export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  return fetchWithFallback('/api/dashboard/stats', {
    totalDeals: 1247,
    activeAlerts: 8,
    crawlerStatus: 'running',
    queueSize: 42,
    profitToday: 2847.50,
    dealsToday: 23,
  });
}

// Marketplace scanner
export interface MarketplaceDeal {
  id: string;
  title: string;
  marketplace: string;
  price: number;
  estimatedProfit: number;
  profitMargin: number;
  url: string;
  detectedAt: string;
  status: 'new' | 'analyzing' | 'verified' | 'sold';
}

export async function getMarketplaceDeals(): Promise<ApiResponse<MarketplaceDeal[]>> {
  return fetchWithFallback('/api/deals', [
    {
      id: '1',
      title: 'iPhone 14 Pro 256GB - Excellent Condition',
      marketplace: 'Facebook Marketplace',
      price: 650,
      estimatedProfit: 250,
      profitMargin: 38.5,
      url: 'https://facebook.com/marketplace/item/123',
      detectedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      status: 'new',
    },
    {
      id: '2',
      title: 'MacBook Air M1 2020 8GB RAM',
      marketplace: 'OfferUp',
      price: 550,
      estimatedProfit: 150,
      profitMargin: 27.3,
      url: 'https://offerup.com/item/456',
      detectedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      status: 'analyzing',
    },
    {
      id: '3',
      title: 'AirPods Pro 2nd Gen New Sealed',
      marketplace: 'Craigslist',
      price: 180,
      estimatedProfit: 40,
      profitMargin: 22.2,
      url: 'https://craigslist.org/item/789',
      detectedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      status: 'verified',
    },
  ]);
}

// Alerts
export interface Alert {
  id: string;
  type: 'high_profit' | 'price_drop' | 'new_listing' | 'error';
  severity: 'info' | 'warning' | 'error';
  message: string;
  dealId?: string;
  createdAt: string;
  read: boolean;
}

export async function getAlerts(): Promise<ApiResponse<Alert[]>> {
  return fetchWithFallback('/api/alerts', [
    {
      id: '1',
      type: 'high_profit',
      severity: 'warning',
      message: 'High profit deal detected: iPhone 14 Pro with 38% margin',
      dealId: '1',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      read: false,
    },
    {
      id: '2',
      type: 'new_listing',
      severity: 'info',
      message: 'New listing found matching your criteria',
      dealId: '2',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      read: false,
    },
    {
      id: '3',
      type: 'error',
      severity: 'error',
      message: 'Failed to crawl Facebook Marketplace - rate limit exceeded',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: true,
    },
  ]);
}

// Crawler status
export interface CrawlerStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  lastRun: string;
  itemsCrawled: number;
  errors: number;
}

export async function getCrawlerStatus(): Promise<ApiResponse<CrawlerStatus[]>> {
  return fetchWithFallback('/api/crawler/status', [
    {
      name: 'Facebook Marketplace',
      status: 'running',
      lastRun: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      itemsCrawled: 1247,
      errors: 2,
    },
    {
      name: 'OfferUp',
      status: 'running',
      lastRun: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      itemsCrawled: 892,
      errors: 0,
    },
    {
      name: 'Craigslist',
      status: 'stopped',
      lastRun: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      itemsCrawled: 456,
      errors: 5,
    },
  ]);
}

// Scheduler status
export interface SchedulerJob {
  id: string;
  name: string;
  schedule: string;
  nextRun: string;
  lastRun: string;
  status: 'active' | 'paused' | 'failed';
}

export async function getSchedulerJobs(): Promise<ApiResponse<SchedulerJob[]>> {
  return fetchWithFallback('/api/scheduler/jobs', [
    {
      id: '1',
      name: 'Crawl Facebook Marketplace',
      schedule: '*/15 * * * *',
      nextRun: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
      lastRun: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      status: 'active',
    },
    {
      id: '2',
      name: 'Analyze New Deals',
      schedule: '*/30 * * * *',
      nextRun: new Date(Date.now() + 1000 * 60 * 25).toISOString(),
      lastRun: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      status: 'active',
    },
    {
      id: '3',
      name: 'Send Alerts',
      schedule: '0 * * * *',
      nextRun: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
      lastRun: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      status: 'active',
    },
  ]);
}

// Redis queue monitor
export interface QueueMetrics {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export async function getQueueMetrics(): Promise<ApiResponse<QueueMetrics[]>> {
  return fetchWithFallback('/api/queue/metrics', [
    {
      queueName: 'crawler',
      waiting: 42,
      active: 5,
      completed: 1247,
      failed: 8,
    },
    {
      queueName: 'analyzer',
      waiting: 15,
      active: 3,
      completed: 892,
      failed: 3,
    },
    {
      queueName: 'alerts',
      waiting: 2,
      active: 1,
      completed: 456,
      failed: 1,
    },
  ]);
}
