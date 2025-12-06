/**
 * Proxy Integration Types
 * Defines types for proxy provider configuration and marketplace-specific proxy profiles
 */

export type ProxyRiskTier = "low" | "medium" | "high";

export interface MarketplaceProxyProfile {
  marketplaceId: string;              // "facebook", "vinted", "gumtree", etc.
  enabled: boolean;
  riskTier: ProxyRiskTier;            // influences rotation / concurrency
  defaultRegion?: string;             // "GB", "US", "DE" etc.
  maxRequestsPerIp?: number;          // soft limit before rotating
  maxConcurrency?: number;            // per worker instance
}

export interface ProxyProviderConfig {
  providerName: string;               // "brightdata", "scrapeops", "custom"
  baseUrl: string;                    // e.g. "http://proxy.provider.com:8000"
  username?: string;
  password?: string;
  authToken?: string;                 // for header-based auth
  globalRegion?: string;
  enabled: boolean;
}

