/**
 * Depop Scraper
 * Real implementation using Playwright for dynamic content
 */
import { BrowserManager } from "../utils/browserManager.js";
export class DepopScraper {
    browserManager;
    config;
    BASE_URL = "https://www.depop.com";
    constructor(config) {
        this.browserManager = new BrowserManager();
        this.config = config;
    }
    async scrape() {
        const startTime = Date.now();
        const result = {
            marketplace: "depop",
            success: false,
            listings: [],
            total_scraped: 0,
            errors: [],
            started_at: new Date().toISOString(),
            completed_at: "",
            duration_ms: 0,
        };
        let page = null;
        try {
            await this.browserManager.launch(this.config);
            const context = await this.browserManager.createContext(this.config);
            page = await this.browserManager.createPage(context);
            for (const query of this.config.search_queries) {
                try {
                    const listings = await this.scrapeQuery(page, query);
                    result.listings.push(...listings);
                }
                catch (error) {
                    result.errors.push(`Error scraping query "${query}": ${error.message}`);
                }
            }
            result.total_scraped = result.listings.length;
            result.success = result.listings.length > 0;
        }
        catch (error) {
            result.errors.push(`Depop scraper error: ${error.message}`);
        }
        finally {
            if (page)
                await page.close();
            await this.browserManager.close();
            result.completed_at = new Date().toISOString();
            result.duration_ms = Date.now() - startTime;
        }
        return result;
    }
    async scrapeQuery(page, query) {
        const listings = [];
        const searchUrl = `${this.BASE_URL}/search/?q=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: "networkidle" });
        await this.browserManager.randomDelay(2000, 3000);
        // Scroll to load more items
        await this.browserManager.infiniteScroll(page, this.config.max_pages * 2);
        // Extract listings
        const listingElements = await page.$$('li[data-testid="product"]');
        for (const element of listingElements.slice(0, this.config.max_pages * 20)) {
            try {
                const listing = await this.extractListingData(page, element);
                if (listing)
                    listings.push(listing);
            }
            catch (error) {
                console.error(`Error extracting Depop listing: ${error.message}`);
            }
        }
        return listings;
    }
    async extractListingData(page, element) {
        try {
            const linkElement = await element.$('a[data-testid="product__link"]');
            if (!linkElement)
                return null;
            const href = await linkElement.getAttribute("href");
            const link = href?.startsWith("http") ? href : `${this.BASE_URL}${href}`;
            const titleElement = await element.$('p[data-testid="product__title"]');
            const title = titleElement ? (await titleElement.textContent())?.trim() || "Untitled" : "Untitled";
            const priceElement = await element.$('p[data-testid="product__price"]');
            const priceText = priceElement ? await priceElement.textContent() : "$0";
            const price = this.parsePrice(priceText || "$0");
            const imgElement = await element.$("img");
            const imgSrc = imgElement ? await imgElement.getAttribute("src") : null;
            const images = imgSrc ? [imgSrc] : [];
            const sellerElement = await element.$('p[data-testid="product__shop"]');
            const seller_name = sellerElement ? (await sellerElement.textContent())?.trim() : undefined;
            const seller_id = seller_name || this.extractIdFromUrl(link);
            return {
                title,
                price,
                currency: "USD",
                link,
                images,
                seller_id,
                seller_name,
                timestamp: new Date().toISOString(),
                condition: "unknown",
                marketplace: "depop",
            };
        }
        catch (error) {
            console.error(`Error extracting Depop listing data: ${error.message}`);
            return null;
        }
    }
    parsePrice(priceText) {
        const cleaned = priceText.replace(/[^0-9.]/g, "");
        return parseFloat(cleaned) || 0;
    }
    extractIdFromUrl(url) {
        const match = url.match(/\/products\/([^/]+)/);
        return match ? match[1] : Buffer.from(url).toString("base64").slice(0, 16);
    }
}
//# sourceMappingURL=depop.js.map