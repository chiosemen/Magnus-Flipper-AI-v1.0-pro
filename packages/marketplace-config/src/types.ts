export type MarketplaceId =
  | 'facebook'
  | 'craigslist'
  | 'ebay'
  | 'vinted'
  | 'gumtree'
  | 'offerup';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type JsChallengeRisk = 'none' | 'low' | 'medium' | 'high';

export interface MarketplaceProfile {
  id: MarketplaceId;
  displayName: string;
  baseUrl: string;
  
  // Rate limiting (per IP)
  maxRequestsPerMinutePerIp: number;
  maxConcurrentRequestsPerIp: number;
  
  // Timing & cadence
  recommendedPingIntervalSeconds: number;
  jitterSeconds: number;
  burstWindowSeconds: number; // Time window for burst requests
  burstMaxRequests: number; // Max requests in burst window
  
  // Backoff behavior on 429 / rate limit
  backoffMultiplierOn429: number;
  cooldownSecondsOn429: number;
  exponentialBackoffMaxSeconds: number; // Max backoff time
  
  // Risk assessment
  riskLevel: RiskLevel;
  jsChallengeRisk: JsChallengeRisk; // Likelihood of JS challenges (Cloudflare, etc.)
  throttleBudget: number; // Daily request budget (0 = unlimited)
  captchaRisk?: 'low' | 'medium' | 'high';
  botDefenseVendors?: string[]; // e.g., Cloudflare, Akamai, PerimeterX
  sessionAffinityRequired?: boolean; // Requires sticky session / cookies
  preferredClient?: 'browser' | 'http'; // Browser automation vs plain HTTP
  signatureMutationRequired?: boolean; // Needs rotating signatures/fingerprints
  
  // Anti-bot evasion
  requiresUserAgentRotation: boolean;
  requiresProxyRotation: boolean;
  requiresCookieSession: boolean;
  
  // CPU efficiency
  cpuIntensity: 'low' | 'medium' | 'high'; // CPU usage estimate
  recommendedWorkerCount: number; // Optimal worker instances
  
  // Free-form notes for UI / admin
  notes?: string;
  monitoringTags?: string[];
}
