import { MarketplaceProfile } from './types';

export const MARKETPLACE_PROFILES: Record<string, MarketplaceProfile> = {
  facebook: {
    id: 'facebook',
    displayName: 'Facebook Marketplace',
    baseUrl: 'https://www.facebook.com/marketplace',
    maxRequestsPerMinutePerIp: 20,
    maxConcurrentRequestsPerIp: 2,
    recommendedPingIntervalSeconds: 300, // 5m baseline
    jitterSeconds: 60,
    backoffMultiplierOn429: 1.5,
    cooldownSecondsOn429: 600, // 10m cooldown
    riskLevel: 'high',
    notes: 'High anti-abuse sensitivity; keep frequency low and respect backoff.'
  },
  craigslist: {
    id: 'craigslist',
    displayName: 'Craigslist',
    baseUrl: 'https://www.craigslist.org',
    maxRequestsPerMinutePerIp: 60,
    maxConcurrentRequestsPerIp: 5,
    recommendedPingIntervalSeconds: 120,
    jitterSeconds: 30,
    backoffMultiplierOn429: 1.3,
    cooldownSecondsOn429: 300,
    riskLevel: 'medium',
    notes: 'Relatively tolerant but still monitor for 429s / blocks.'
  },
  ebay: {
    id: 'ebay',
    displayName: 'eBay',
    baseUrl: 'https://www.ebay.com',
    maxRequestsPerMinutePerIp: 40,
    maxConcurrentRequestsPerIp: 3,
    recommendedPingIntervalSeconds: 180,
    jitterSeconds: 45,
    backoffMultiplierOn429: 1.4,
    cooldownSecondsOn429: 600,
    riskLevel: 'medium',
    notes: 'Prefer official APIs when possible; scraping should be within polite limits.'
  },
  vinted: {
    id: 'vinted',
    displayName: 'Vinted',
    baseUrl: 'https://www.vinted.com',
    maxRequestsPerMinutePerIp: 40,
    maxConcurrentRequestsPerIp: 3,
    recommendedPingIntervalSeconds: 180,
    jitterSeconds: 45,
    backoffMultiplierOn429: 1.4,
    cooldownSecondsOn429: 600,
    riskLevel: 'medium'
  },
  gumtree: {
    id: 'gumtree',
    displayName: 'Gumtree',
    baseUrl: 'https://www.gumtree.com',
    maxRequestsPerMinutePerIp: 60,
    maxConcurrentRequestsPerIp: 5,
    recommendedPingIntervalSeconds: 120,
    jitterSeconds: 30,
    backoffMultiplierOn429: 1.3,
    cooldownSecondsOn429: 300,
    riskLevel: 'medium'
  },
  offerup: {
    id: 'offerup',
    displayName: 'OfferUp',
    baseUrl: 'https://offerup.com',
    maxRequestsPerMinutePerIp: 30,
    maxConcurrentRequestsPerIp: 3,
    recommendedPingIntervalSeconds: 240,
    jitterSeconds: 60,
    backoffMultiplierOn429: 1.4,
    cooldownSecondsOn429: 600,
    riskLevel: 'high'
  }
};
