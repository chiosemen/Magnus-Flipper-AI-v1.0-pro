/**
 * Enhanced Browser Manager with User-Agent Rotation & Fingerprinting
 * CPU-efficient, burst-optimized, anti-detection
 */

import { chromium, Browser, BrowserContext, Page } from "playwright";
import type { ScraperConfig } from "../types/ScrapedListing.js";
import {
  generateFingerprint,
  getComplianceConstraints,
  validateCompliance,
  type RequestFingerprint,
} from "@magnus-flipper-ai/compliance-shield";
import { getMarketplaceProfile } from "@magnus-flipper-ai/marketplace-config";

export class BrowserManager {
  private browser: Browser | null = null;
  private contexts: Map<string, BrowserContext> = new Map();
  private currentProxy: string | null = null;
  private fingerprint: RequestFingerprint | null = null;
  private proxyRotationIndex = 0;
  private userAgentRotationIndex = 0;

  /**
   * Launch browser with stealth mode and anti-bot fingerprinting
   * CPU-optimized: Reuses browser instance, creates contexts on-demand
   */
  async launch(config: ScraperConfig, marketplaceId?: string): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    // Get marketplace profile for fingerprinting
    let profile;
    if (marketplaceId) {
      try {
        profile = getMarketplaceProfile(marketplaceId);
        this.fingerprint = generateFingerprint(profile);
      } catch {
        // Fallback if profile not found
        this.fingerprint = generateFingerprint({
          requiresUserAgentRotation: true,
          requiresProxyRotation: false,
          requiresCookieSession: false,
        } as any);
      }
    }

    // Select random proxy if enabled
    if (config.use_proxy && config.proxy_list && config.proxy_list.length > 0) {
      this.currentProxy = this.selectRandomProxy(config.proxy_list);
    }

    const launchOptions: any = {
      headless: config.headless ?? true,
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
    return this.browser;
  }

  /**
   * Create a new browser context with realistic fingerprinting
   * CPU-safe: Reuses contexts when possible, rotates fingerprints
   */
  async createContext(
    config: ScraperConfig,
    marketplaceId?: string,
    forceNew = false
  ): Promise<BrowserContext> {
    if (!this.browser) {
      await this.launch(config, marketplaceId);
    }

    // Reuse context if available and not forcing new
    const contextKey = marketplaceId || "default";
    if (!forceNew && this.contexts.has(contextKey)) {
      return this.contexts.get(contextKey)!;
    }

    // Get or generate fingerprint
    let fingerprint = this.fingerprint;
    if (!fingerprint || forceNew) {
      let profile;
      if (marketplaceId) {
        try {
          profile = getMarketplaceProfile(marketplaceId);
        } catch {
          profile = null;
        }
      }
      fingerprint = generateFingerprint(
        profile || {
          requiresUserAgentRotation: true,
          requiresProxyRotation: false,
          requiresCookieSession: false,
        } as any
      );
      this.fingerprint = fingerprint;
    }

    const context = await this.browser!.newContext({
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

    // Load cookies if provided
    if (config.cookies && config.cookies.length > 0) {
      await context.addCookies(config.cookies);
    }

    // Enhanced anti-detection scripts (CPU-optimized)
    // Note: This code runs in the browser context via addInitScript
    // TypeScript sees this as Node.js code, but it executes in browser
    await context.addInitScript(() => {
      // Browser globals exist in execution context - use type assertions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = globalThis.navigator as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = globalThis.window as any;

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
      win.navigator.permissions.query = (parameters: any) =>
        parameters.name === "notifications"
          ? Promise.resolve({
              state: Notification.permission,
            } as PermissionStatus)
          : originalQuery(parameters);

      // Override getBattery (if available) - browser-only API
      // Runtime check ensures this only runs in browser context where getBattery may exist
      if ('getBattery' in nav && typeof nav.getBattery === 'function') {
        nav.getBattery = () =>
          Promise.resolve({
            charging: true,
            chargingTime: 0,
            dischargingTime: Infinity,
            level: 1,
          });
      }

      // Override canvas fingerprinting
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function (type?: string, quality?: any) {
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
  async createPage(context?: BrowserContext, marketplaceId?: string): Promise<Page> {
    const ctx = context || (await this.createContext({} as ScraperConfig, marketplaceId));
    const page = await ctx.newPage();

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
  async randomDelay(minMs: number, maxMs: number): Promise<void> {
    // Exponential distribution for more human-like delays
    const lambda = 1 / ((minMs + maxMs) / 2);
    const delay = Math.floor(-Math.log(1 - Math.random()) / lambda);
    const clampedDelay = Math.max(minMs, Math.min(maxMs, delay));
    
    await new Promise((resolve) => setTimeout(resolve, clampedDelay));
  }

  /**
   * Human-like mouse movement with Bezier curves
   */
  async humanLikeClick(page: Page, selector: string): Promise<void> {
    const element = await page.$(selector);
    if (!element) return;

    const box = await element.boundingBox();
    if (!box) return;

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
  async humanLikeScroll(page: Page, distance: number = 500): Promise<void> {
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
  async infiniteScroll(
    page: Page,
    maxScrolls: number = 10,
    scrollDelay: number = 2000
  ): Promise<void> {
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
  rotateProxy(proxyList: string[]): void {
    if (proxyList.length === 0) return;
    this.proxyRotationIndex = (this.proxyRotationIndex + 1) % proxyList.length;
    this.currentProxy = proxyList[this.proxyRotationIndex];
  }

  /**
   * Select random proxy from list
   */
  private selectRandomProxy(proxyList: string[]): string {
    return proxyList[Math.floor(Math.random() * proxyList.length)];
  }

  /**
   * Rotate user agent and regenerate fingerprint
   */
  rotateFingerprint(marketplaceId?: string): RequestFingerprint {
    let profile;
    if (marketplaceId) {
      try {
        profile = getMarketplaceProfile(marketplaceId);
      } catch {
        profile = null;
      }
    }
    this.fingerprint = generateFingerprint(
      profile || {
        requiresUserAgentRotation: true,
        requiresProxyRotation: false,
        requiresCookieSession: false,
      } as any
    );
    return this.fingerprint;
  }

  /**
   * Save cookies for persistence
   */
  async saveCookies(contextKey?: string): Promise<any[]> {
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
  async close(): Promise<void> {
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
  getCurrentProxy(): string | null {
    return this.currentProxy;
  }

  /**
   * Get current fingerprint
   */
  getCurrentFingerprint(): RequestFingerprint | null {
    return this.fingerprint;
  }
}
