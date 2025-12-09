export type MarketplaceId =
  | 'facebook'
  | 'craigslist'
  | 'ebay'
  | 'vinted'
  | 'gumtree'
  | 'offerup';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface MarketplaceProfile {
  id: MarketplaceId;
  displayName: string;
  baseUrl: string;
  // Absolute safety caps (per IP)
  maxRequestsPerMinutePerIp: number;
  maxConcurrentRequestsPerIp: number;
  // Recommended baseline polling
  recommendedPingIntervalSeconds: number;
  jitterSeconds: number;
  // Backoff behaviour on 429 / rate limit
  backoffMultiplierOn429: number;
  cooldownSecondsOn429: number;
  // How "spicy" this marketplace is allowed to be
  riskLevel: RiskLevel;
  // Free-form notes for UI / admin
  notes?: string;
}
