/**
 * Demo Mode - Server-side utilities
 *
 * PURPOSE:
 * ========
 * Provides demo data detection and generation for Server Components
 *
 * USAGE (Server Components):
 * ==========================
 * import { getDashboardDataWithDemo } from '@/lib/demo/serverDemoMode';
 *
 * const data = await getDashboardDataWithDemo(user);
 *
 * REMOVAL:
 * ========
 * To disable demo mode:
 * 1. Replace getDashboardDataWithDemo calls with real data queries
 * 2. Delete this file and demoData.ts
 */

import { createSupabaseServer } from '@/lib/supabase/server';
import { getDemoDashboardData, isDemoUser } from './demoData';

/**
 * Get dashboard data - uses demo data for demo users, real data for others
 */
export async function getDashboardDataWithDemo(user: any) {
  // Check if demo user
  if (isDemoUser(user?.email)) {
    console.log('[Demo Mode] Serving demo data for:', user.email);
    return getDemoDashboardData();
  }

  // Real user - fetch real data
  const supabase = await createSupabaseServer();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Total pooled deals
  const { count: totalDeals } = await supabase
    .from('scraped_listings')
    .select('*', { count: 'exact', head: true })
    .is('search_id', null)
    .eq('is_stale', false);

  // New in 24h
  const { count: new24h } = await supabase
    .from('scraped_listings')
    .select('*', { count: 'exact', head: true })
    .is('search_id', null)
    .eq('is_stale', false)
    .gte('first_seen_at', yesterday.toISOString());

  // Hot deals
  const { count: hotDeals } = await supabase
    .from('scraped_listings')
    .select('*', { count: 'exact', head: true })
    .is('search_id', null)
    .eq('is_stale', false)
    .gte('freshness_score', 80);

  // Freshness percentage
  const { count: freshCount } = await supabase
    .from('scraped_listings')
    .select('*', { count: 'exact', head: true })
    .is('search_id', null)
    .eq('is_stale', false)
    .gte('freshness_score', 70);

  const freshnessPercent = totalDeals ? Math.round((freshCount! / totalDeals) * 100) : 0;

  // Marketplace breakdown
  const { data: marketplaceStats } = await supabase
    .from('scraped_listings')
    .select('marketplace, freshness_score')
    .is('search_id', null)
    .eq('is_stale', false);

  const marketplaceCounts: Record<string, { count: number; avgHeat: number }> = {};
  (marketplaceStats || []).forEach((item) => {
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

  // Live deals
  const { data: liveDeals } = await supabase
    .from('scraped_listings')
    .select('id, title, marketplace, price, link, images, freshness_score')
    .is('search_id', null)
    .eq('is_stale', false)
    .not('images', 'is', null)
    .order('freshness_score', { ascending: false })
    .order('first_seen_at', { ascending: false })
    .limit(8);

  // Saved searches
  const { data: savedSearches } = await supabase
    .from('saved_searches')
    .select('marketplaces')
    .eq('active', true);

  const searchesByMarketplace: Record<string, number> = {};
  (savedSearches || []).forEach((search) => {
    (search.marketplaces || []).forEach((mp: string) => {
      searchesByMarketplace[mp] = (searchesByMarketplace[mp] || 0) + 1;
    });
  });

  // Scraper health
  const { data: scraperHealth } = await supabase
    .from('scraper_health')
    .select('marketplace, status, last_run_at, last_success_at, error_rate')
    .order('marketplace');

  // Admin metrics
  const { count: staleDeals24h } = await supabase
    .from('scraped_listings')
    .select('*', { count: 'exact', head: true })
    .is('search_id', null)
    .eq('is_stale', true)
    .gte('updated_at', yesterday.toISOString());

  const { data: activePools } = await supabase
    .from('scraped_listings')
    .select('marketplace')
    .is('search_id', null)
    .eq('is_stale', false);

  const activePoolsCount = new Set((activePools || []).map((item) => item.marketplace)).size;

  const { count: alertsSent24h } = await supabase
    .from('alert_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'SENT')
    .gte('created_at', yesterday.toISOString());

  return {
    overview: {
      totalDeals: totalDeals || 0,
      new24h: new24h || 0,
      hotDeals: hotDeals || 0,
      freshnessPercent,
    },
    marketplaceBreakdown: marketplaceCounts,
    liveDeals: liveDeals || [],
    savedSearchesCount: savedSearches?.length || 0,
    searchesByMarketplace,
    scraperHealth: scraperHealth || [],
    adminMetrics: {
      staleDeals24h: staleDeals24h || 0,
      activePoolsCount,
      alertsSent24h: alertsSent24h || 0,
    },
    poolHealthData: [],
  };
}
