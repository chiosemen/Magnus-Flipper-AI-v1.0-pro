/**
 * Enhanced Browser Manager with User-Agent Rotation & Fingerprinting
 * CPU-efficient, burst-optimized, anti-detection
 */
import { chromium } from "playwright";
import { generateFingerprint, } from "@magnus-flipper-ai/compliance-shield";
import { getMarketplaceProfile } from "@magnus-flipper-ai/marketplace-config";
import { MARKETPLACE_COOKIES_PLAYWRIGHT } from "../runtime/marketplaceCookies.js";
export class BrowserManager {
    browser = null;
    contexts = new Map();
    currentProxy = null;
    fingerprint = null;
    proxyRotationIndex = 0;
    userAgentRotationIndex = 0;
    /**
     * Launch browser with stealth mode and anti-bot fingerprinting
     * CPU-optimized: Reuses browser instance, creates contexts on-demand
     */
    async launch(config, marketplaceId) {
        if (this.browser) {
            return this.browser;
        }
        // Get marketplace profile for fingerprinting
        let profile;
        if (marketplaceId) {
            try {
                profile = getMarketplaceProfile(marketplaceId);
                this.fingerprint = generateFingerprint(profile);
            }
            catch {
                // Fallback if profile not found
                this.fingerprint = generateFingerprint({
                    requiresUserAgentRotation: true,
                    requiresProxyRotation: false,
                    requiresCookieSession: false,
                });
            }
        }
        // Select random proxy if enabled
        if (config.use_proxy && config.proxy_list && config.proxy_list.length > 0) {
            this.currentProxy = this.selectRandomProxy(config.proxy_list);
        }
        // Check HEADLESS environment variable (takes precedence over config)
        const headless = process.env.HEADLESS === "false" ? false : (config.headless ?? true);
        const launchOptions = {
            headless,
            slowMo: headless ? 0 : 50,
            args: [
                "--disable-blink-features=AutomationControlled",
                "--disable-features=IsolateOrigins,site-per-process",
                "--disable-site-isolation-trials",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--disable-gpu",
                "--disable-background-timer-throttling", // CPU optimization
                "--disable-backgrounding-occluded-windows", // CPU optimization
                "--disable-renderer-backgrounding", // CPU optimization
                "--window-size=1920,1080",
                "--start-maximized",
            ],
        };
        if (this.currentProxy) {
            launchOptions.proxy = {
                server: this.currentProxy,
            };
        }
        this.browser = await chromium.launch(launchOptions);
        console.log("[PLAYWRIGHT] Browser launched", { headless });
        return this.browser;
    }
    /**
     * Create a new browser context with realistic fingerprinting
     * CPU-safe: Reuses contexts when possible, rotates fingerprints
     */
    async createContext(config, marketplaceId, forceNew = false) {
        if (!this.browser) {
            await this.launch(config, marketplaceId);
        }
        // Reuse context if available and not forcing new
        const contextKey = marketplaceId || "default";
        if (!forceNew && this.contexts.has(contextKey)) {
            return this.contexts.get(contextKey);
        }
        // Get or generate fingerprint
        let fingerprint = this.fingerprint;
        if (!fingerprint || forceNew) {
            let profile;
            if (marketplaceId) {
                try {
                    profile = getMarketplaceProfile(marketplaceId);
                }
                catch {
                    profile = null;
                }
            }
            fingerprint = generateFingerprint(profile || {
                requiresUserAgentRotation: true,
                requiresProxyRotation: false,
                requiresCookieSession: false,
            });
            this.fingerprint = fingerprint;
        }
        const context = await this.browser.newContext({
            userAgent: fingerprint.userAgent,
            viewport: fingerprint.viewport,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            locale: fingerprint.locale,
            timezoneId: fingerprint.timezone,
            permissions: ["geolocation"],
            geolocation: { latitude: 40.7128, longitude: -74.006 }, // NYC default
            colorScheme: "light",
            extraHTTPHeaders: fingerprint.headers,
        });
        // Load cookies if provided in config
        if (config.cookies && config.cookies.length > 0) {
            await context.addCookies(config.cookies);
        }
        // Auto-inject marketplace cookies from JSON files
        if (marketplaceId) {
            const marketplaceCookies = MARKETPLACE_COOKIES_PLAYWRIGHT[marketplaceId];
            if (marketplaceCookies && marketplaceCookies.length > 0) {
                await context.addCookies(marketplaceCookies);
            }
        }
        // Enhanced anti-detection scripts (CPU-optimized)
        // Note: This code runs in the browser context via addInitScript
        // TypeScript sees this as Node.js code, but it executes in browser
        await context.addInitScript(() => {
            // Browser globals exist in execution context - use type assertions
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const nav = globalThis.navigator;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const win = globalThis.window;
            // Override navigator.webdriver
            Object.defineProperty(nav, "webdriver", {
                get: () => undefined,
                configurable: true,
            });
            // Override plugins (realistic count)
            Object.defineProperty(nav, "plugins", {
                get: () => {
                    const plugins = [];
                    for (let i = 0; i < 5; i++) {
                        plugins.push({
                            name: `Plugin ${i}`,
                            description: `Plugin ${i} Description`,
                        });
                    }
                    return plugins;
                },
                configurable: true,
            });
            // Override languages
            Object.defineProperty(nav, "languages", {
                get: () => ["en-US", "en"],
                configurable: true,
            });
            // Add chrome object
            win.chrome = {
                runtime: {},
                loadTimes: () => ({}),
                csi: () => ({}),
                app: {},
            };
            // Override permissions
            const originalQuery = win.navigator.permissions.query;
            win.navigator.permissions.query = (parameters) => parameters.name === "notifications"
                ? Promise.resolve({
                    state: Notification.permission,
                })
                : originalQuery(parameters);
            // Override getBattery (if available) - browser-only API
            // Runtime check ensures this only runs in browser context where getBattery may exist
            if ('getBattery' in nav && typeof nav.getBattery === 'function') {
                nav.getBattery = () => Promise.resolve({
                    charging: true,
                    chargingTime: 0,
                    dischargingTime: Infinity,
                    level: 1,
                });
            }
            // Override canvas fingerprinting
            const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
            HTMLCanvasElement.prototype.toDataURL = function (type, quality) {
                // Add slight noise to prevent fingerprinting
                const context = this.getContext("2d");
                if (context) {
                    const imageData = context.getImageData(0, 0, this.width, this.height);
                    for (let i = 0; i < imageData.data.length; i += 4) {
                        imageData.data[i] += Math.floor(Math.random() * 3) - 1;
                    }
                    context.putImageData(imageData, 0, 0);
                }
                return originalToDataURL.apply(this, [type, quality]);
            };
        });
        // Store context for reuse
        this.contexts.set(contextKey, context);
        return context;
    }
    /**
     * Create a new page with random delays and human-like behavior
     * CPU-safe: Limits concurrent pages, reuses when possible
     */
    async createPage(context, marketplaceId) {
        const ctx = context || (await this.createContext({}, marketplaceId));
        const page = await ctx.newPage();
        console.log("[PLAYWRIGHT] Page created");
        // Apply fingerprint viewport with slight jitter
        if (this.fingerprint) {
            const jitter = Math.floor(Math.random() * 20) - 10; // ±10px
            await page.setViewportSize({
                width: this.fingerprint.viewport.width + jitter,
                height: this.fingerprint.viewport.height + jitter,
            });
        }
        return page;
    }
    /**
     * Random delay with human-like variance and jitter
     * Uses exponential distribution for more realistic timing
     */
    async randomDelay(minMs, maxMs) {
        // Exponential distribution for more human-like delays
        const lambda = 1 / ((minMs + maxMs) / 2);
        const delay = Math.floor(-Math.log(1 - Math.random()) / lambda);
        const clampedDelay = Math.max(minMs, Math.min(maxMs, delay));
        await new Promise((resolve) => setTimeout(resolve, clampedDelay));
    }
    /**
     * Human-like mouse movement with Bezier curves
     */
    async humanLikeClick(page, selector) {
        const element = await page.$(selector);
        if (!element)
            return;
        const box = await element.boundingBox();
        if (!box)
            return;
        // Move to random point within element with Bezier-like path
        const targetX = box.x + Math.random() * box.width;
        const targetY = box.y + Math.random() * box.height;
        const startX = Math.random() * 1920;
        const startY = Math.random() * 1080;
        // Bezier curve approximation (3 control points)
        const steps = 10 + Math.floor(Math.random() * 20);
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = startX + (targetX - startX) * (t * t * (3 - 2 * t)); // Smoothstep
            const y = startY + (targetY - startY) * (t * t * (3 - 2 * t));
            await page.mouse.move(x, y);
            await this.randomDelay(5, 15);
        }
        await this.randomDelay(50, 150);
        await page.mouse.click(targetX, targetY);
    }
    /**
     * Human-like scrolling with variable speed
     */
    async humanLikeScroll(page, distance = 500) {
        const scrollSteps = 5 + Math.floor(Math.random() * 10);
        const stepDistance = distance / scrollSteps;
        for (let i = 0; i < scrollSteps; i++) {
            // Variable scroll speed (faster in middle, slower at start/end)
            const speedMultiplier = Math.sin((i / scrollSteps) * Math.PI);
            await page.mouse.wheel(0, stepDistance * speedMultiplier);
            await this.randomDelay(50, 200);
        }
    }
    /**
     * Infinite scroll handler with CPU throttling
     */
    async infiniteScroll(page, maxScrolls = 10, scrollDelay = 2000) {
        let previousHeight = 0;
        let scrollCount = 0;
        while (scrollCount < maxScrolls) {
            // Browser context evaluation - document exists in browser
            const currentHeight = await page.evaluate(() => {
                return typeof document !== 'undefined' ? document.body.scrollHeight : 0;
            });
            if (currentHeight === previousHeight) {
                // Reached bottom or no new content
                break;
            }
            await this.humanLikeScroll(page, 500);
            await this.randomDelay(scrollDelay, scrollDelay + 1000);
            previousHeight = currentHeight;
            scrollCount++;
            // CPU throttling: Yield to event loop every 3 scrolls
            if (scrollCount % 3 === 0) {
                await new Promise((resolve) => setImmediate(resolve));
            }
        }
    }
    /**
     * Rotate proxy from list
     */
    rotateProxy(proxyList) {
        if (proxyList.length === 0)
            return;
        this.proxyRotationIndex = (this.proxyRotationIndex + 1) % proxyList.length;
        this.currentProxy = proxyList[this.proxyRotationIndex];
    }
    /**
     * Select random proxy from list
     */
    selectRandomProxy(proxyList) {
        return proxyList[Math.floor(Math.random() * proxyList.length)];
    }
    /**
     * Rotate user agent and regenerate fingerprint
     */
    rotateFingerprint(marketplaceId) {
        let profile;
        if (marketplaceId) {
            try {
                profile = getMarketplaceProfile(marketplaceId);
            }
            catch {
                profile = null;
            }
        }
        this.fingerprint = generateFingerprint(profile || {
            requiresUserAgentRotation: true,
            requiresProxyRotation: false,
            requiresCookieSession: false,
        });
        return this.fingerprint;
    }
    /**
     * Save cookies for persistence
     */
    async saveCookies(contextKey) {
        const key = contextKey || "default";
        const context = this.contexts.get(key);
        if (!context) {
            return [];
        }
        return await context.cookies();
    }
    /**
     * Close browser and all contexts
     */
    async close() {
        for (const context of this.contexts.values()) {
            await context.close();
        }
        this.contexts.clear();
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    /**
     * Get current proxy
     */
    getCurrentProxy() {
        return this.currentProxy;
    }
    /**
     * Get current fingerprint
     */
    getCurrentFingerprint() {
        return this.fingerprint;
    }
}
//# sourceMappingURL=browserManager.js.map