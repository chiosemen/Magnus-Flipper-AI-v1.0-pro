// Mock data for fallback when API is unavailable

export const mockDashboardStats = {
  totalListings: 1247,
  activeAlerts: 23,
  todayFinds: 18,
  potentialProfit: 15420,
  listingsChange: 12.5,
  alertsChange: -3.2,
  findsChange: 8.7,
  profitChange: 15.3,
}

export const mockRecentListings = [
  {
    id: '1',
    title: 'MacBook Pro 16" M2 Max',
    price: 1200,
    marketValue: 2400,
    profit: 1200,
    location: 'San Francisco, CA',
    marketplace: 'Facebook Marketplace',
    postedAt: '2024-01-15T10:30:00Z',
    image: '/placeholder-laptop.jpg',
    condition: 'Used - Like New',
  },
  {
    id: '2',
    title: 'iPhone 15 Pro Max 256GB',
    price: 800,
    marketValue: 1200,
    profit: 400,
    location: 'Los Angeles, CA',
    marketplace: 'Facebook Marketplace',
    postedAt: '2024-01-15T09:15:00Z',
    image: '/placeholder-phone.jpg',
    condition: 'Used - Good',
  },
  {
    id: '3',
    title: 'Sony A7 IV Camera Body',
    price: 1500,
    marketValue: 2200,
    profit: 700,
    location: 'New York, NY',
    marketplace: 'Facebook Marketplace',
    postedAt: '2024-01-15T08:45:00Z',
    image: '/placeholder-camera.jpg',
    condition: 'Used - Excellent',
  },
]

export const mockAlerts = [
  {
    id: '1',
    type: 'high_profit',
    title: 'High Profit Opportunity Detected',
    message: 'MacBook Pro 16" M2 Max listed at 50% below market value',
    timestamp: '2024-01-15T10:30:00Z',
    read: false,
    priority: 'high',
  },
  {
    id: '2',
    type: 'price_drop',
    title: 'Price Drop Alert',
    message: 'iPhone 15 Pro Max price reduced by $200',
    timestamp: '2024-01-15T09:15:00Z',
    read: false,
    priority: 'medium',
  },
  {
    id: '3',
    type: 'new_listing',
    title: 'New Listing Match',
    message: 'Sony A7 IV matches your saved search criteria',
    timestamp: '2024-01-15T08:45:00Z',
    read: true,
    priority: 'low',
  },
]

export const mockCrawlerStatus = [
  {
    id: 'crawler-1',
    marketplace: 'Facebook Marketplace',
    status: 'active',
    lastRun: '2024-01-15T10:25:00Z',
    itemsFound: 145,
    successRate: 98.5,
    avgResponseTime: 1.2,
  },
  {
    id: 'crawler-2',
    marketplace: 'Craigslist',
    status: 'active',
    lastRun: '2024-01-15T10:20:00Z',
    itemsFound: 89,
    successRate: 95.3,
    avgResponseTime: 0.8,
  },
  {
    id: 'crawler-3',
    marketplace: 'eBay',
    status: 'idle',
    lastRun: '2024-01-15T09:00:00Z',
    itemsFound: 234,
    successRate: 99.1,
    avgResponseTime: 1.5,
  },
]

export const mockScheduledJobs = [
  {
    id: 'job-1',
    name: 'Facebook Marketplace Scan',
    schedule: '*/15 * * * *',
    nextRun: '2024-01-15T10:45:00Z',
    lastRun: '2024-01-15T10:30:00Z',
    status: 'scheduled',
  },
  {
    id: 'job-2',
    name: 'Price Analysis',
    schedule: '0 */1 * * *',
    nextRun: '2024-01-15T11:00:00Z',
    lastRun: '2024-01-15T10:00:00Z',
    status: 'scheduled',
  },
  {
    id: 'job-3',
    name: 'Alert Processing',
    schedule: '*/5 * * * *',
    nextRun: '2024-01-15T10:40:00Z',
    lastRun: '2024-01-15T10:35:00Z',
    status: 'running',
  },
]

export const mockQueueStats = {
  crawler: {
    waiting: 12,
    active: 3,
    completed: 1458,
    failed: 15,
  },
  analyzer: {
    waiting: 8,
    active: 2,
    completed: 1342,
    failed: 8,
  },
  alerts: {
    waiting: 5,
    active: 1,
    completed: 876,
    failed: 3,
  },
}

export const mockSystemHealth = {
  status: 'healthy',
  uptime: 345600, // seconds
  services: [
    {
      name: 'API',
      status: 'healthy',
      responseTime: 45,
      uptime: 99.9,
    },
    {
      name: 'Redis',
      status: 'healthy',
      responseTime: 2,
      uptime: 99.99,
    },
    {
      name: 'Worker - Crawler',
      status: 'healthy',
      responseTime: 1200,
      uptime: 98.5,
    },
    {
      name: 'Worker - Analyzer',
      status: 'healthy',
      responseTime: 850,
      uptime: 99.2,
    },
    {
      name: 'Worker - Alerts',
      status: 'healthy',
      responseTime: 120,
      uptime: 99.8,
    },
  ],
  metrics: {
    cpu: 42,
    memory: 68,
    disk: 35,
  },
}
