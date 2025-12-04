// User and Auth Types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier?: SubscriptionTier;
  subscription_status?: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

// Subscription Types
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

// Product Types (for flipping items)
export interface Product {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  brand?: string;
  condition: ProductCondition;
  purchase_price?: number;
  target_sell_price?: number;
  actual_sell_price?: number;
  listing_url?: string;
  images: string[];
  status: ProductStatus;
  ai_valuation?: AIValuation;
  market_insights?: MarketInsight[];
  created_at: string;
  updated_at: string;
  sold_at?: string;
}

export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';
export type ProductStatus = 'draft' | 'listed' | 'sold' | 'archived';

// AI and Extensions Types
export interface AIValuation {
  estimated_value: number;
  confidence_score: number;
  price_range: {
    min: number;
    max: number;
  };
  comparable_items: ComparableItem[];
  generated_at: string;
}

export interface ComparableItem {
  title: string;
  price: number;
  condition: string;
  sold_date?: string;
  marketplace: string;
  url?: string;
}

export interface MarketInsight {
  id: string;
  type: 'trend' | 'alert' | 'recommendation';
  title: string;
  description: string;
  severity?: 'info' | 'warning' | 'critical';
  action_url?: string;
  created_at: string;
}

// Extension Types
export interface Extension {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  config?: Record<string, any>;
  tier_required: SubscriptionTier;
}

export interface AIAction {
  id: string;
  type: 'valuation' | 'description' | 'pricing' | 'market_analysis';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  product_id?: string;
  input_data: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  created_at: string;
  completed_at?: string;
}

// Analytics Types
export interface DashboardStats {
  total_products: number;
  active_listings: number;
  total_revenue: number;
  total_profit: number;
  avg_profit_margin: number;
  items_sold_this_month: number;
  revenue_this_month: number;
  profit_this_month: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  created_at: string;
}
