/**
 * Enhanced Browser Manager with User-Agent Rotation & Fingerprinting
 * CPU-efficient, burst-optimized, anti-detection
 */
import { Browser, BrowserContext, Page } from "playwright";
import type { ScraperConfig } from "../types/ScrapedListing.js";
import { type RequestFingerprint } from "@magnus-flipper-ai/compliance-shield";
export declare class BrowserManager {
    private browser;
    private contexts;
    private currentProxy;
    private fingerprint;
    private proxyRotationIndex;
    private userAgentRotationIndex;
    /**
     * Launch browser with stealth mode and anti-bot fingerprinting
     * CPU-optimized: Reuses browser instance, creates contexts on-demand
     */
    launch(config: ScraperConfig, marketplaceId?: string): Promise<Browser>;
    /**
     * Create a new browser context with realistic fingerprinting
     * CPU-safe: Reuses contexts when possible, rotates fingerprints
     */
    createContext(config: ScraperConfig, marketplaceId?: string, forceNew?: boolean): Promise<BrowserContext>;
    /**
     * Create a new page with random delays and human-like behavior
     * CPU-safe: Limits concurrent pages, reuses when possible
     */
    createPage(context?: BrowserContext, marketplaceId?: string): Promise<Page>;
    /**
     * Random delay with human-like variance and jitter
     * Uses exponential distribution for more realistic timing
     */
    randomDelay(minMs: number, maxMs: number): Promise<void>;
    /**
     * Human-like mouse movement with Bezier curves
     */
    humanLikeClick(page: Page, selector: string): Promise<void>;
    /**
     * Human-like scrolling with variable speed
     */
    humanLikeScroll(page: Page, distance?: number): Promise<void>;
    /**
     * Infinite scroll handler with CPU throttling
     */
    infiniteScroll(page: Page, maxScrolls?: number, scrollDelay?: number): Promise<void>;
    /**
     * Rotate proxy from list
     */
    rotateProxy(proxyList: string[]): void;
    /**
     * Select random proxy from list
     */
    private selectRandomProxy;
    /**
     * Rotate user agent and regenerate fingerprint
     */
    rotateFingerprint(marketplaceId?: string): RequestFingerprint;
    /**
     * Save cookies for persistence
     */
    saveCookies(contextKey?: string): Promise<any[]>;
    /**
     * Close browser and all contexts
     */
    close(): Promise<void>;
    /**
     * Get current proxy
     */
    getCurrentProxy(): string | null;
    /**
     * Get current fingerprint
     */
    getCurrentFingerprint(): RequestFingerprint | null;
}
//# sourceMappingURL=browserManager.d.ts.map