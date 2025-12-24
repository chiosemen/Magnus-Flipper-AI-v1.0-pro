/**
 * Server-side Demo Mode Utilities
 *
 * Provides demo data for demo users on server-side
 */

import { User } from '@supabase/supabase-js';
import { isDemoUser, getDemoDashboardData } from './demoData';

/**
 * Get dashboard data - returns demo data for demo users, real data otherwise
 */
export async function getDashboardDataWithDemo(user: User | null) {
  // Check if user is a demo user
  const isDemo = isDemoUser(user?.email);

  if (isDemo) {
    // Return demo data for demo users
    return getDemoDashboardData();
  }

  // For non-demo users, return real data
  // In a real implementation, this would query the database
  // For now, return empty/default data structure
  return {
    overview: {
      totalDeals: 0,
      new24h: 0,
      hotDeals: 0,
      freshnessPercent: 0,
    },
    adminMetrics: {
      staleDeals24h: 0,
      activePoolsCount: 0,
      alertsSent24h: 0,
    },
    poolHealthData: [],
    marketplaceBreakdown: {},
    liveDeals: [],
    savedSearchesCount: 0,
    searchesByMarketplace: {},
    scraperHealth: [],
  };
}
