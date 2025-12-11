export type MarketplaceId = 'facebook' | 'craigslist' | 'ebay' | 'vinted' | 'gumtree' | 'offerup';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type JsChallengeRisk = 'none' | 'low' | 'medium' | 'high';
export interface MarketplaceProfile {
    id: MarketplaceId;
    displayName: string;
    baseUrl: string;
    maxRequestsPerMinutePerIp: number;
    maxConcurrentRequestsPerIp: number;
    recommendedPingIntervalSeconds: number;
    jitterSeconds: number;
    burstWindowSeconds: number;
    burstMaxRequests: number;
    backoffMultiplierOn429: number;
    cooldownSecondsOn429: number;
    exponentialBackoffMaxSeconds: number;
    riskLevel: RiskLevel;
    jsChallengeRisk: JsChallengeRisk;
    throttleBudget: number;
    captchaRisk?: 'low' | 'medium' | 'high';
    botDefenseVendors?: string[];
    sessionAffinityRequired?: boolean;
    preferredClient?: 'browser' | 'http';
    signatureMutationRequired?: boolean;
    requiresUserAgentRotation: boolean;
    requiresProxyRotation: boolean;
    requiresCookieSession: boolean;
    cpuIntensity: 'low' | 'medium' | 'high';
    recommendedWorkerCount: number;
    notes?: string;
    monitoringTags?: string[];
}
//# sourceMappingURL=types.d.ts.map