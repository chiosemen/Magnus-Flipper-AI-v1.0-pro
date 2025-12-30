/**
 * Test fixtures for mobile tests
 * 
 * Provides deterministic data for testing without real API calls.
 */

export const mockDemoResponse = {
  items: [
    {
      source: 'gumtree',
      title: 'MacBook Pro 14" M1 Pro 2021',
      priceText: '£1,200',
      url: 'https://www.gumtree.com/p/macbook-pro-14',
      image: 'https://example.com/macbook.jpg',
      badge: 'verified' as const,
      freshnessSeconds: 120,
    },
    {
      source: 'gumtree',
      title: 'iPhone 13 Pro Max 256GB',
      priceText: '£650',
      url: 'https://www.gumtree.com/p/iphone-13-pro',
      image: 'https://example.com/iphone.jpg',
      badge: 'live-capture' as const,
      freshnessSeconds: 30,
    },
    {
      source: 'gumtree',
      title: 'Sony WH-1000XM4 Headphones',
      priceText: '£180',
      url: 'https://www.gumtree.com/p/sony-headphones',
      image: 'https://example.com/sony.jpg',
      badge: 'recent' as const,
      freshnessSeconds: 300,
    },
  ],
  meta: {
    marketplace: 'gumtree',
    country: 'GB',
    cached: false,
    cacheStatus: 'miss-filled',
    strategy: 'apify',
    ageSeconds: 0,
    ttlSeconds: 180,
    ms: 1234,
  },
};

export const mockCachedDemoResponse = {
  items: mockDemoResponse.items.map((item) => ({
    ...item,
    badge: 'recent' as const,
    freshnessSeconds: item.freshnessSeconds + 60,
  })),
  meta: {
    ...mockDemoResponse.meta,
    cached: true,
    cacheStatus: 'hit',
    ageSeconds: 60,
  },
};

export const mockEmptyDemoResponse = {
  items: [],
  meta: {
    marketplace: 'vinted',
    country: 'GB',
    cached: false,
    cacheStatus: 'miss-empty',
    strategy: 'browser-first',
    ageSeconds: 0,
    ttlSeconds: 120,
    ms: 500,
  },
};

export const mockUsageResponse = {
  todayCu: 15.5,
  monthCu: 245.3,
  byMarketplace: [
    { marketplace: 'gumtree', cu: 120.5, label: 'Gumtree' },
    { marketplace: 'vinted', cu: 80.2, label: 'Vinted' },
    { marketplace: 'facebook', cu: 44.6, label: 'Facebook Marketplace' },
  ],
  recentRuns: [
    { market: 'gumtree', cu_estimated: 2.5, time: '2024-01-15T10:30:00Z' },
    { market: 'vinted', cu_estimated: 1.8, time: '2024-01-15T10:25:00Z' },
  ],
  policy: {
    tier: 'pro',
    maxQueriesPerRun: 10,
    maxConcurrency: 5,
    marketsAllowed: ['gumtree', 'vinted', 'facebook'],
    dailyCuLimit: 100,
    cuCapPerRun: 10,
  },
  features: {
    marketAgent: {
      enabled: true,
      status: 'active' as const,
      graceUntil: null,
      seatsPurchased: 1,
      seatsUsed: 1,
    },
  },
  limits: {
    marketAgent: {
      runsPerDay: 250,
      minRefreshSeconds: 60,
      maxItemsPerDay: 20000,
    },
  },
  usage: {
    marketAgent: {
      today: {
        runs: 45,
        deploys: 5,
        refreshTicks: 40,
        seedIngests: 2,
        itemsReturned: 890,
        uniqueQueries: 12,
        billableRuns: 45,
      },
    },
  },
};

export const mockUsageResponseGrace = {
  ...mockUsageResponse,
  features: {
    marketAgent: {
      enabled: true,
      status: 'past_due' as const,
      graceUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      seatsPurchased: 1,
      seatsUsed: 1,
    },
  },
};

export const mockUsageResponseDisabled = {
  ...mockUsageResponse,
  features: {
    marketAgent: {
      enabled: false,
      status: 'canceled' as const,
      graceUntil: null,
      seatsPurchased: 0,
      seatsUsed: 0,
    },
  },
};

export const mockUsageResponseAtLimit = {
  ...mockUsageResponse,
  usage: {
    marketAgent: {
      today: {
        runs: 250,
        deploys: 10,
        refreshTicks: 240,
        seedIngests: 5,
        itemsReturned: 20000,
        uniqueQueries: 50,
        billableRuns: 250,
      },
    },
  },
};

export const mockErrorResponse = {
  error: 'rate_limited',
  message: 'Too many requests. Please try again later.',
};

export const mockEntitlementActive = {
  enabled: true,
  status: 'active' as const,
  graceUntil: null,
};

export const mockEntitlementTrialing = {
  enabled: true,
  status: 'trialing' as const,
  graceUntil: null,
};

export const mockEntitlementPastDue = {
  enabled: true,
  status: 'past_due' as const,
  graceUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

export const mockEntitlementCanceled = {
  enabled: false,
  status: 'canceled' as const,
  graceUntil: null,
};

export const mockEntitlementComped = {
  enabled: true,
  status: 'comped' as const,
  graceUntil: null,
};

