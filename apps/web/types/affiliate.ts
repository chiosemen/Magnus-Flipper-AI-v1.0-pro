// Local affiliate types (temporary until core package exports them)

export type EarningsPeriod = "7d" | "30d" | "90d" | "all";

export interface EarningsDataPoint {
  date: string;
  earnings: number;
  clicks: number;
  conversions: number;
}

export interface AffiliateLink {
  id: string;
  name: string;
  url: string;
  fullUrl?: string;
  clicks: number;
  conversions: number;
  revenue: number;
  status: "active" | "paused" | "inactive";
}

export interface AffiliateCreative {
  id: string;
  name: string;
  type: "banner" | "link" | "text";
  url?: string;
  imageUrl?: string;
  clicks: number;
  conversions: number;
  revenue?: number;
  status?: "active" | "paused" | "inactive";
}

export interface AffiliateMetrics {
  totalClicks: { label: string; value: string };
  conversionRate: { label: string; value: string };
  totalEarnings: { label: string; value: string };
  pendingPayout?: { label: string; value: string };
  activeLinks?: number;
  totalLinks?: number;
}

export interface AffiliateOverview {
  links: AffiliateLink[];
  metrics: AffiliateMetrics;
  recentActivity?: any[];
  recentLinks?: AffiliateLink[];
}
