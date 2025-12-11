/**
 * Compliance Shield v1.0 - Anti-Bot Evasion & Request Fingerprinting
 * Ensures scrapers respect ToS and avoid detection
 *
 * Features:
 * - Request fingerprinting
 * - Compliance validation
 * - Risk scoring
 * - Adaptive throttling guardrails
 */
export * from './riskScoring';
export * from './guardrails';
export * from './observability';
export * from './fingerprintManager';
/**
 * User-Agent rotation pool
 * Realistic, modern user agents from different browsers/platforms
 */
const USER_AGENTS = [
    // Chrome on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    // Chrome on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    // Firefox on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
    // Firefox on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0',
    // Safari on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
    // Edge on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
];
const ACCEPT_LANGUAGES = [
    'en-US,en;q=0.9',
    'en-US,en;q=0.9,es;q=0.8',
    'en-GB,en;q=0.9',
    'en-CA,en;q=0.9,fr;q=0.8',
];
const TIMEZONES = [
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'America/Denver',
    'Europe/London',
    'Europe/Paris',
];
const LOCALES = ['en-US', 'en-GB', 'en-CA', 'en-AU'];
/**
 * Get a random user agent from the pool
 */
export function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}
/**
 * Generate a unique request fingerprint for anti-detection
 */
export function generateFingerprint(profile) {
    const userAgent = profile.requiresUserAgentRotation
        ? getRandomUserAgent()
        : USER_AGENTS[0]; // Default Chrome
    // Extract platform from user agent
    let platform = 'Win32';
    if (userAgent.includes('Macintosh'))
        platform = 'MacIntel';
    if (userAgent.includes('Linux'))
        platform = 'Linux x86_64';
    // Generate realistic viewport (common resolutions)
    const viewports = [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1536, height: 864 },
        { width: 1440, height: 900 },
        { width: 1280, height: 720 },
    ];
    const viewport = viewports[Math.floor(Math.random() * viewports.length)];
    const acceptLanguage = ACCEPT_LANGUAGES[Math.floor(Math.random() * ACCEPT_LANGUAGES.length)];
    const timezone = TIMEZONES[Math.floor(Math.random() * TIMEZONES.length)];
    const locale = LOCALES[Math.floor(Math.random() * LOCALES.length)];
    // Generate realistic headers
    const headers = {
        'Accept-Language': acceptLanguage,
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
    };
    // Add browser-specific headers
    if (userAgent.includes('Chrome')) {
        headers['sec-ch-ua'] = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"';
        headers['sec-ch-ua-mobile'] = '?0';
        headers['sec-ch-ua-platform'] = `"${platform === 'MacIntel' ? 'macOS' : 'Windows'}"`;
    }
    return {
        userAgent,
        acceptLanguage,
        acceptEncoding: 'gzip, deflate, br',
        viewport,
        timezone,
        locale,
        platform,
        headers,
    };
}
/**
 * Get compliance constraints for a marketplace
 */
export function getComplianceConstraints(profile) {
    return {
        maxRequestsPerDay: profile.throttleBudget || 10000,
        maxConcurrentRequests: profile.maxConcurrentRequestsPerIp,
        requiresProxy: profile.requiresProxyRotation,
        requiresSession: profile.requiresCookieSession,
        minDelayBetweenRequests: Math.floor((profile.recommendedPingIntervalSeconds * 1000) / profile.maxRequestsPerMinutePerIp),
    };
}
/**
 * Validate request compliance before execution
 */
export function validateCompliance(profile, dailyRequestCount, hasProxy, hasSession) {
    const constraints = getComplianceConstraints(profile);
    if (dailyRequestCount >= constraints.maxRequestsPerDay) {
        return {
            compliant: false,
            reason: `Daily request limit exceeded: ${dailyRequestCount}/${constraints.maxRequestsPerDay}`,
        };
    }
    if (constraints.requiresProxy && !hasProxy) {
        return {
            compliant: false,
            reason: 'Proxy required but not configured',
        };
    }
    if (constraints.requiresSession && !hasSession) {
        return {
            compliant: false,
            reason: 'Session/cookies required but not configured',
        };
    }
    return { compliant: true };
}
//# sourceMappingURL=index.js.map