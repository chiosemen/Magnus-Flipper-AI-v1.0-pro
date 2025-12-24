/**
 * Demo Data Utilities
 *
 * Provides demo mode detection and sample data for demo users
 */

/**
 * Check if user is a demo user based on email
 */
export function isDemoUser(email: string | null | undefined): boolean {
  if (!email) return false;

  // Demo users have emails matching @demo.* pattern
  return email.includes('@demo.') || email.startsWith('demo@');
}

/**
 * Get demo dashboard data
 */
export function getDemoDashboardData() {
  return {
    overview: {
      totalDeals: 1250,
      new24h: 47,
      hotDeals: 23,
      freshnessPercent: 92,
    },
    adminMetrics: {
      staleDeals24h: 8,
      activePoolsCount: 5,
      alertsSent24h: 156,
    },
    poolHealthData: [
      {
        poolId: '1',
        marketplace: 'facebook',
        region: 'US',
        lastScrapeAt: new Date(),
        dealCount: 450,
        staleCount: 30,
        stalePercent: 6.7,
        status: 'healthy' as const,
      },
      {
        poolId: '2',
        marketplace: 'vinted',
        region: 'UK',
        lastScrapeAt: new Date(),
        dealCount: 380,
        staleCount: 20,
        stalePercent: 5.3,
        status: 'healthy' as const,
      },
    ],
    marketplaceBreakdown: {
      facebook: { count: 450, avgHeat: 75 },
      vinted: { count: 380, avgHeat: 82 },
      ebay: { count: 280, avgHeat: 68 },
      poshmark: { count: 140, avgHeat: 71 },
    },
    liveDeals: [
      {
        id: 'demo-1',
        title: 'Vintage Leather Jacket',
        price: '45',
        marketplace: 'facebook',
        link: '#',
        images: ['https://placehold.co/400x400/1a1a1a/4FF0E6?text=Demo+Deal'],
        freshness_score: 95,
      },
      {
        id: 'demo-2',
        title: 'Designer Handbag',
        price: '120',
        marketplace: 'vinted',
        link: '#',
        images: ['https://placehold.co/400x400/1a1a1a/8A4FFF?text=Demo+Deal'],
        freshness_score: 88,
      },
    ],
    savedSearchesCount: 3,
    searchesByMarketplace: {
      facebook: 1,
      vinted: 2,
    },
    scraperHealth: [
      {
        marketplace: 'facebook',
        status: 'active' as const,
        last_run_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        error_rate: 2,
      },
      {
        marketplace: 'vinted',
        status: 'active' as const,
        last_run_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        error_rate: 1,
      },
    ],
  };
}
