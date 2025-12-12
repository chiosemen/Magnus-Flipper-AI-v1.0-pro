/**
 * Affiliate Portal Types
 * 
 * Shared TypeScript types for affiliate/referral system
 * Used across web and mobile platforms
 */

/**
 * Affiliate Link
 */
export interface AffiliateLink {
  id: string;
  userId: string;
  name: string;
  url: string;
  shortCode: string;
  fullUrl: string; // Generated affiliate URL
  clicks: number;
  conversions: number;
  revenue: number;
  status: 'active' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
  metadata?: {
    campaign?: string;
    source?: string;
    medium?: string;
    [key: string]: any;
  };
}

/**
 * Affiliate Creative
 */
export interface AffiliateCreative {
  id: string;
  userId: string;
  name: string;
  type: 'banner' | 'text' | 'button' | 'link';
  url?: string;
  imageUrl?: string;
  html?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  clicks: number;
  conversions: number;
  revenue: number;
  status: 'active' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
}

/**
 * Affiliate Earning
 */
export interface AffiliateEarning {
  id: string;
  userId: string;
  linkId?: string;
  creativeId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled';
  payoutDate?: string;
  createdAt: string;
  metadata?: {
    referralId?: string;
    orderId?: string;
    commissionRate?: number;
    [key: string]: any;
  };
}

/**
 * Affiliate Metrics
 */
export interface AffiliateMetrics {
  totalEarnings: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number; // Percentage
  totalLinks: number;
  activeLinks: number;
  totalCreatives: number;
  activeCreatives: number;
  pendingPayout: number;
  paidOut: number;
  period: {
    start: string;
    end: string;
  };
}

/**
 * Affiliate Overview Data
 */
export interface AffiliateOverview {
  metrics: AffiliateMetrics;
  recentLinks: AffiliateLink[];
  recentEarnings: AffiliateEarning[];
  topPerformers: {
    links: Array<{
      link: AffiliateLink;
      revenue: number;
      clicks: number;
      conversionRate: number;
    }>;
    creatives: Array<{
      creative: AffiliateCreative;
      revenue: number;
      clicks: number;
      conversionRate: number;
    }>;
  };
}

/**
 * Earnings Time Series Data Point
 */
export interface EarningsDataPoint {
  date: string;
  earnings: number;
  clicks: number;
  conversions: number;
}

/**
 * Create Affiliate Link Request
 */
export interface CreateAffiliateLinkRequest {
  name: string;
  url: string;
  campaign?: string;
  source?: string;
  medium?: string;
}

/**
 * Update Affiliate Link Request
 */
export interface UpdateAffiliateLinkRequest {
  name?: string;
  url?: string;
  status?: 'active' | 'paused' | 'archived';
  campaign?: string;
}

/**
 * Earnings Period Filter
 */
export type EarningsPeriod = '7d' | '30d' | '90d' | 'all';
