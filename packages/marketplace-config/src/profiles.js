export const MARKETPLACE_PROFILES = {
    facebook: {
        id: 'facebook',
        displayName: 'Facebook Marketplace',
        baseUrl: 'https://www.facebook.com/marketplace',
        maxRequestsPerMinutePerIp: 20,
        maxConcurrentRequestsPerIp: 2,
        recommendedPingIntervalSeconds: 300, // 5m baseline
        jitterSeconds: 60, // ±1min jitter
        burstWindowSeconds: 60, // 1min burst window
        burstMaxRequests: 5, // Max 5 requests in burst
        backoffMultiplierOn429: 1.5,
        cooldownSecondsOn429: 600, // 10m cooldown
        exponentialBackoffMaxSeconds: 3600, // Max 1hr backoff
        riskLevel: 'high',
        jsChallengeRisk: 'high',
        throttleBudget: 5000, // ~5000 requests/day max
        captchaRisk: 'high',
        botDefenseVendors: ['cloudflare'],
        sessionAffinityRequired: true,
        preferredClient: 'browser',
        signatureMutationRequired: true,
        requiresUserAgentRotation: true,
        requiresProxyRotation: true,
        requiresCookieSession: true,
        cpuIntensity: 'high',
        recommendedWorkerCount: 2,
        notes: 'High anti-abuse sensitivity; requires stealth mode, proxy rotation, and session management.',
        monitoringTags: ['risk:high', 'captcha:high', 'ua:rotate', 'proxy:rotate']
    },
    craigslist: {
        id: 'craigslist',
        displayName: 'Craigslist',
        baseUrl: 'https://www.craigslist.org',
        maxRequestsPerMinutePerIp: 60,
        maxConcurrentRequestsPerIp: 5,
        recommendedPingIntervalSeconds: 120, // 2m baseline
        jitterSeconds: 30, // ±30s jitter
        burstWindowSeconds: 30, // 30s burst window
        burstMaxRequests: 10, // Max 10 requests in burst
        backoffMultiplierOn429: 1.3,
        cooldownSecondsOn429: 300, // 5m cooldown
        exponentialBackoffMaxSeconds: 1800, // Max 30min backoff
        riskLevel: 'medium',
        jsChallengeRisk: 'low',
        throttleBudget: 15000, // ~15k requests/day max
        captchaRisk: 'low',
        botDefenseVendors: [],
        sessionAffinityRequired: false,
        preferredClient: 'http',
        requiresUserAgentRotation: false,
        requiresProxyRotation: false,
        requiresCookieSession: false,
        cpuIntensity: 'medium',
        recommendedWorkerCount: 3,
        notes: 'Relatively tolerant but still monitor for 429s / blocks. Multi-city support.',
        monitoringTags: ['risk:medium', 'captcha:low']
    },
    ebay: {
        id: 'ebay',
        displayName: 'eBay',
        baseUrl: 'https://www.ebay.com',
        maxRequestsPerMinutePerIp: 40,
        maxConcurrentRequestsPerIp: 3,
        recommendedPingIntervalSeconds: 180, // 3m baseline
        jitterSeconds: 45, // ±45s jitter
        burstWindowSeconds: 60, // 1min burst window
        burstMaxRequests: 8, // Max 8 requests in burst
        backoffMultiplierOn429: 1.4,
        cooldownSecondsOn429: 600, // 10m cooldown
        exponentialBackoffMaxSeconds: 3600, // Max 1hr backoff
        riskLevel: 'medium',
        jsChallengeRisk: 'medium',
        throttleBudget: 10000, // ~10k requests/day max
        captchaRisk: 'medium',
        botDefenseVendors: ['akamai'],
        sessionAffinityRequired: true,
        preferredClient: 'browser',
        signatureMutationRequired: true,
        requiresUserAgentRotation: true,
        requiresProxyRotation: false,
        requiresCookieSession: false,
        cpuIntensity: 'medium',
        recommendedWorkerCount: 2,
        notes: 'Prefer official APIs when possible; scraping should be within polite limits. Has bot detection.',
        monitoringTags: ['risk:medium', 'captcha:medium', 'ua:rotate']
    },
    vinted: {
        id: 'vinted',
        displayName: 'Vinted',
        baseUrl: 'https://www.vinted.com',
        maxRequestsPerMinutePerIp: 40,
        maxConcurrentRequestsPerIp: 3,
        recommendedPingIntervalSeconds: 180, // 3m baseline
        jitterSeconds: 45, // ±45s jitter
        burstWindowSeconds: 60, // 1min burst window
        burstMaxRequests: 8, // Max 8 requests in burst
        backoffMultiplierOn429: 1.4,
        cooldownSecondsOn429: 600, // 10m cooldown
        exponentialBackoffMaxSeconds: 3600, // Max 1hr backoff
        riskLevel: 'medium',
        jsChallengeRisk: 'medium',
        throttleBudget: 10000, // ~10k requests/day max
        captchaRisk: 'medium',
        botDefenseVendors: ['cloudflare'],
        sessionAffinityRequired: true,
        preferredClient: 'browser',
        signatureMutationRequired: true,
        requiresUserAgentRotation: true,
        requiresProxyRotation: false,
        requiresCookieSession: true,
        cpuIntensity: 'medium',
        recommendedWorkerCount: 2,
        notes: 'API-based scraping with session management. Moderate bot detection.',
        monitoringTags: ['risk:medium', 'captcha:medium', 'session:required']
    },
    gumtree: {
        id: 'gumtree',
        displayName: 'Gumtree',
        baseUrl: 'https://www.gumtree.com',
        maxRequestsPerMinutePerIp: 60,
        maxConcurrentRequestsPerIp: 5,
        recommendedPingIntervalSeconds: 120, // 2m baseline
        jitterSeconds: 30, // ±30s jitter
        burstWindowSeconds: 30, // 30s burst window
        burstMaxRequests: 10, // Max 10 requests in burst
        backoffMultiplierOn429: 1.3,
        cooldownSecondsOn429: 300, // 5m cooldown
        exponentialBackoffMaxSeconds: 1800, // Max 30min backoff
        riskLevel: 'medium',
        jsChallengeRisk: 'low',
        throttleBudget: 15000, // ~15k requests/day max
        captchaRisk: 'low',
        botDefenseVendors: [],
        sessionAffinityRequired: false,
        preferredClient: 'http',
        requiresUserAgentRotation: false,
        requiresProxyRotation: false,
        requiresCookieSession: false,
        cpuIntensity: 'low',
        recommendedWorkerCount: 4,
        notes: 'UK marketplace. Relatively tolerant. Low CPU overhead.',
        monitoringTags: ['risk:medium', 'captcha:low']
    },
    offerup: {
        id: 'offerup',
        displayName: 'OfferUp',
        baseUrl: 'https://offerup.com',
        maxRequestsPerMinutePerIp: 30,
        maxConcurrentRequestsPerIp: 3,
        recommendedPingIntervalSeconds: 240, // 4m baseline
        jitterSeconds: 60, // ±1min jitter
        burstWindowSeconds: 60, // 1min burst window
        burstMaxRequests: 5, // Max 5 requests in burst
        backoffMultiplierOn429: 1.4,
        cooldownSecondsOn429: 600, // 10m cooldown
        exponentialBackoffMaxSeconds: 3600, // Max 1hr backoff
        riskLevel: 'high',
        jsChallengeRisk: 'high',
        throttleBudget: 5000, // ~5k requests/day max
        captchaRisk: 'high',
        botDefenseVendors: ['cloudflare'],
        sessionAffinityRequired: true,
        preferredClient: 'browser',
        signatureMutationRequired: true,
        requiresUserAgentRotation: true,
        requiresProxyRotation: true,
        requiresCookieSession: true,
        cpuIntensity: 'high',
        recommendedWorkerCount: 2,
        notes: 'High anti-bot sensitivity. Requires stealth mode, proxy rotation, and careful timing.',
        monitoringTags: ['risk:high', 'captcha:high', 'proxy:rotate', 'session:required']
    }
};
export function getMarketplaceProfile(id) {
    const profile = MARKETPLACE_PROFILES[id];
    if (!profile) {
        throw new Error(`Unknown marketplace profile: ${id}`);
    }
    return profile;
}
//# sourceMappingURL=profiles.js.map