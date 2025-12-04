/**
 * Browser Manager
 * Manages Playwright browser instances with anti-bot measures
 */

import { chromium, Browser, BrowserContext, Page } from "playwright";
import type { ScraperConfig } from "../types/ScrapedListing.js";

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private currentProxy: string | null = null;

  /**
   * Launch browser with stealth mode and anti-bot fingerprinting
   */
  async launch(config: ScraperConfig): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    // Select random proxy if enabled
    if (config.use_proxy && config.proxy_list && config.proxy_list.length > 0) {
      this.currentProxy = this.selectRandomProxy(config.proxy_list);
    }

    const launchOptions: any = {
      headless: config.headless,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-site-isolation-trials",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
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
   */
  async createContext(config: ScraperConfig): Promise<BrowserContext> {
    if (!this.browser) {
      await this.launch(config);
    }

    const userAgent =
      config.user_agent ||
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

    this.context = await this.browser!.newContext({
      userAgent,
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      locale: "en-US",
      timezoneId: "America/New_York",
      permissions: ["geolocation"],
      geolocation: { latitude: 40.7128, longitude: -74.006 }, // NYC default
      colorScheme: "light",
      extraHTTPHeaders: {
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-User": "?1",
        "Sec-Fetch-Dest": "document",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    // Load cookies if provided
    if (config.cookies && config.cookies.length > 0) {
      await this.context.addCookies(config.cookies);
    }

    // Inject anti-detection scripts
    await this.context.addInitScript(() => {
      // Override navigator.webdriver
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      // Override plugins
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });

      // Override languages
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });

      // Add chrome object
      (window as any).chrome = {
        runtime: {},
      };

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) =>
        parameters.name === "notifications"
          ? Promise.resolve({
              state: Notification.permission,
            } as PermissionStatus)
          : originalQuery(parameters);
    });

    return this.context;
  }

  /**
   * Create a new page with random delays and human-like behavior
   */
  async createPage(context?: BrowserContext): Promise<Page> {
    const ctx = context || this.context;
    if (!ctx) {
      throw new Error("Browser context not initialized");
    }

    const page = await ctx.newPage();

    // Random viewport jitter
    const width = 1920 + Math.floor(Math.random() * 100);
    const height = 1080 + Math.floor(Math.random() * 100);
    await page.setViewportSize({ width, height });

    return page;
  }

  /**
   * Random delay with human-like variance
   */
  async randomDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Human-like mouse movement
   */
  async humanLikeClick(page: Page, selector: string): Promise<void> {
    const element = await page.$(selector);
    if (!element) return;

    const box = await element.boundingBox();
    if (!box) return;

    // Move to random point within element
    const x = box.x + Math.random() * box.width;
    const y = box.y + Math.random() * box.height;

    await page.mouse.move(x, y, { steps: 10 + Math.floor(Math.random() * 20) });
    await this.randomDelay(50, 150);
    await page.mouse.click(x, y);
  }

  /**
   * Human-like scrolling
   */
  async humanLikeScroll(page: Page, distance: number = 500): Promise<void> {
    const scrollSteps = 5 + Math.floor(Math.random() * 10);
    const stepDistance = distance / scrollSteps;

    for (let i = 0; i < scrollSteps; i++) {
      await page.mouse.wheel(0, stepDistance);
      await this.randomDelay(50, 200);
    }
  }

  /**
   * Infinite scroll handler
   */
  async infiniteScroll(
    page: Page,
    maxScrolls: number = 10,
    scrollDelay: number = 2000
  ): Promise<void> {
    let previousHeight = 0;
    let scrollCount = 0;

    while (scrollCount < maxScrolls) {
      const currentHeight = await page.evaluate(() => document.body.scrollHeight);

      if (currentHeight === previousHeight) {
        // Reached bottom
        break;
      }

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await this.randomDelay(scrollDelay, scrollDelay + 1000);

      previousHeight = currentHeight;
      scrollCount++;
    }
  }

  /**
   * Select random proxy from list
   */
  private selectRandomProxy(proxyList: string[]): string {
    return proxyList[Math.floor(Math.random() * proxyList.length)];
  }

  /**
   * Save cookies for persistence
   */
  async saveCookies(): Promise<any[]> {
    if (!this.context) {
      return [];
    }
    return await this.context.cookies();
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
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
}
