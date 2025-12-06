/**
 * Proxy Configuration Loader
 * Loads proxy provider and marketplace-specific proxy profiles from environment variables
 */

import { ProxyProviderConfig, MarketplaceProxyProfile } from "./proxy-types.js";

export function loadProxyProviderConfig(): ProxyProviderConfig {
  return {
    providerName: process.env.PROXY_PROVIDER_NAME ?? "none",
    baseUrl: process.env.PROXY_BASE_URL ?? "",
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD,
    authToken: process.env.PROXY_AUTH_TOKEN,
    globalRegion: process.env.PROXY_DEFAULT_REGION ?? "GB",
    enabled: process.env.USE_PROXIES === "true",
  };
}

export function loadMarketplaceProxyProfiles(): MarketplaceProxyProfile[] {
  // For now, env-driven / hardcoded. Later can be moved to Supabase table.
  return [
    {
      marketplaceId: "facebook",
      enabled: process.env.PROXY_FB_ENABLED === "true",
      riskTier: "high",
      defaultRegion: process.env.PROXY_FB_REGION ?? "GB",
      maxRequestsPerIp: 50,
      maxConcurrency: 4,
    },
    {
      marketplaceId: "vinted",
      enabled: process.env.PROXY_VINTED_ENABLED === "true",
      riskTier: "medium",
      defaultRegion: process.env.PROXY_VINTED_REGION ?? "DE",
      maxRequestsPerIp: 40,
      maxConcurrency: 3,
    },
    {
      marketplaceId: "gumtree",
      enabled: process.env.PROXY_GUMTREE_ENABLED === "true",
      riskTier: "medium",
      defaultRegion: process.env.PROXY_GUMTREE_REGION ?? "GB",
      maxRequestsPerIp: 40,
      maxConcurrency: 3,
    },
    {
      marketplaceId: "craigslist",
      enabled: process.env.PROXY_CRAIGSLIST_ENABLED === "true",
      riskTier: "medium",
      defaultRegion: process.env.PROXY_CRAIGSLIST_REGION ?? "US",
      maxRequestsPerIp: 40,
      maxConcurrency: 3,
    },
    {
      marketplaceId: "ebay",
      enabled: process.env.PROXY_EBAY_ENABLED === "true",
      riskTier: "low",
      defaultRegion: process.env.PROXY_EBAY_REGION ?? "US",
      maxRequestsPerIp: 60,
      maxConcurrency: 5,
    },
    {
      marketplaceId: "depop",
      enabled: process.env.PROXY_DEPOP_ENABLED === "true",
      riskTier: "medium",
      defaultRegion: process.env.PROXY_DEPOP_REGION ?? "GB",
      maxRequestsPerIp: 40,
      maxConcurrency: 3,
    },
  ];
}

