/**
 * Demo Mode - Seeded Data for Realistic UI
 *
 * PURPOSE:
 * ========
 * Provides realistic demo data when scrapers aren't running yet.
 * Enables UI testing and demonstrations without live marketplace data.
 *
 * DEMO MODE DETECTION:
 * ====================
 * Email-based: user email contains "@demo." (e.g., admin@demo.magnus.ai)
 *
 * REMOVAL:
 * ========
 * To disable demo mode:
 * 1. Delete this file
 * 2. Remove useDemoMode hook usage
 * 3. Remove demo data conditionals from pages
 *
 * SECURITY:
 * =========
 * Demo data is client-side only.
 * No RLS bypass, no security weakening.
 * Production users see real data or empty states.
 */

export interface DemoListing {
  id: string;
  title: string;
  marketplace: string;
  price: string;
  link: string;
  images: string[];
  freshness_score: number;
  first_seen_at: string;
  is_stale: boolean;
  location?: string;
}

export interface DemoSavedSearch {
  id: string;
  marketplaces: string[];
  active: boolean;
}

export interface DemoScraperHealth {
  marketplace: string;
  status: string;
  last_run_at: string | null;
  last_success_at: string | null;
  error_rate: number;
}

// ============================================================================
// DEMO SCRAPED LISTINGS
// ============================================================================

export const DEMO_LISTINGS: DemoListing[] = [
  {
    id: 'demo-1',
    title: 'Apple MacBook Pro 16" M3 Max - Like New',
    marketplace: 'facebook',
    price: '2499',
    link: '#demo',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop'],
    freshness_score: 95,
    first_seen_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    is_stale: false,
    location: 'San Francisco, CA',
  },
  {
    id: 'demo-2',
    title: 'Sony PlayStation 5 Disc Edition Bundle',
    marketplace: 'ebay',
    price: '449',
    link: '#demo',
    images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&h=500&fit=crop'],
    freshness_score: 88,
    first_seen_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    is_stale: false,
    location: 'Los Angeles, CA',
  },
  {
    id: 'demo-3',
    title: 'Nike Air Jordan 1 Retro High - Size 10',
    marketplace: 'vinted',
    price: '180',
    link: '#demo',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop'],
    freshness_score: 92,
    first_seen_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
    is_stale: false,
    location: 'New York, NY',
  },
  {
    id: 'demo-4',
    title: 'Canon EOS R6 Mark II Camera Body',
    marketplace: 'mercari',
    price: '1899',
    link: '#demo',
    images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop'],
    freshness_score: 85,
    first_seen_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 90 min ago
    is_stale: false,
    location: 'Seattle, WA',
  },
  {
    id: 'demo-5',
    title: 'Dyson V15 Detect Absolute Vacuum - Sealed',
    marketplace: 'facebook',
    price: '399',
    link: '#demo',
    images: ['https://images.unsplash.com/photo-1628863353691-0071c8c1874c?w=500&h=500&fit=crop'],
    freshness_score: 90,
    first_seen_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 min ago
    is_stale: false,
    location: 'Austin, TX',
  },
  {
    id: 'demo-6',
    title: 'Bose QuietComfort Ultra Headphones',
    marketplace: 'ebay',
    price: '299',
    link: '#demo',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop'],
    freshness_score: 87,
    first_seen_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    is_stale: false,
    location: 'Miami, FL',
  },
  {
    id: 'demo-7',
    title: 'Apple Watch Series 9 GPS 45mm Titanium',
    marketplace: 'mercari',
    price: '549',
    link: '#demo',
    images: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&h=500&fit=crop'],
    freshness_score: 93,
    first_seen_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
    is_stale: false,
    location: 'Denver, CO',
  },
  {
    id: 'demo-8',
    title: 'Gaming PC - RTX 4080, i9-13900K, 32GB RAM',
    marketplace: 'facebook',
    price: '1999',
    link: '#demo',
    images: ['https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=500&h=500&fit=crop'],
    freshness_score: 82,
    first_seen_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    is_stale: false,
    location: 'Portland, OR',
  },
];

// ============================================================================
// DEMO SAVED SEARCHES
// ============================================================================

export const DEMO_SAVED_SEARCHES: DemoSavedSearch[] = [
  {
    id: 'demo-search-1',
    marketplaces: ['facebook', 'ebay'],
    active: true,
  },
  {
    id: 'demo-search-2',
    marketplaces: ['vinted'],
    active: true,
  },
  {
    id: 'demo-search-3',
    marketplaces: ['mercari', 'facebook'],
    active: true,
  },
];

// ============================================================================
// DEMO SCRAPER HEALTH
// ============================================================================

export const DEMO_SCRAPER_HEALTH: DemoScraperHealth[] = [
  {
    marketplace: 'facebook',
    status: 'healthy',
    last_run_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
    last_success_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    error_rate: 2,
  },
  {
    marketplace: 'ebay',
    status: 'healthy',
    last_run_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(), // 8 min ago
    last_success_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    error_rate: 1,
  },
  {
    marketplace: 'vinted',
    status: 'degraded',
    last_run_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 min ago
    last_success_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    error_rate: 8,
  },
  {
    marketplace: 'mercari',
    status: 'healthy',
    last_run_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 min ago
    last_success_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    error_rate: 3,
  },
];

// ============================================================================
// DEMO DATA AGGREGATOR
// ============================================================================

export function getDemoDashboardData() {
  const totalDeals = DEMO_LISTINGS.filter((l) => !l.is_stale).length;
  const new24h = DEMO_LISTINGS.filter((l) => {
    const age = Date.now() - new Date(l.first_seen_at).getTime();
    return age < 24 * 60 * 60 * 1000 && !l.is_stale;
  }).length;
  const hotDeals = DEMO_LISTINGS.filter((l) => l.freshness_score >= 80 && !l.is_stale).length;
  const freshCount = DEMO_LISTINGS.filter((l) => l.freshness_score >= 70 && !l.is_stale).length;
  const freshnessPercent = totalDeals ? Math.round((freshCount / totalDeals) * 100) : 0;

  // Marketplace breakdown
  const marketplaceCounts: Record<string, { count: number; avgHeat: number }> = {};
  DEMO_LISTINGS.forEach((item) => {
    const mp = item.marketplace || 'unknown';
    if (!marketplaceCounts[mp]) {
      marketplaceCounts[mp] = { count: 0, avgHeat: 0 };
    }
    marketplaceCounts[mp].count++;
    marketplaceCounts[mp].avgHeat += item.freshness_score || 0;
  });

  Object.keys(marketplaceCounts).forEach((mp) => {
    marketplaceCounts[mp].avgHeat = Math.round(
      marketplaceCounts[mp].avgHeat / marketplaceCounts[mp].count
    );
  });

  // Searches by marketplace
  const searchesByMarketplace: Record<string, number> = {};
  DEMO_SAVED_SEARCHES.forEach((search) => {
    search.marketplaces.forEach((mp) => {
      searchesByMarketplace[mp] = (searchesByMarketplace[mp] || 0) + 1;
    });
  });

  return {
    overview: {
      totalDeals,
      new24h,
      hotDeals,
      freshnessPercent,
    },
    marketplaceBreakdown: marketplaceCounts,
    liveDeals: DEMO_LISTINGS.slice(0, 8),
    savedSearchesCount: DEMO_SAVED_SEARCHES.length,
    searchesByMarketplace,
    scraperHealth: DEMO_SCRAPER_HEALTH,
    adminMetrics: {
      staleDeals24h: 0,
      activePoolsCount: Object.keys(marketplaceCounts).length,
      alertsSent24h: 12,
    },
    poolHealthData: [],
  };
}

// ============================================================================
// DEMO MODE DETECTOR
// ============================================================================

/**
 * Check if user is in demo mode based on email
 */
export function isDemoUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().includes('@demo.') || email.toLowerCase().includes('@example.');
}
