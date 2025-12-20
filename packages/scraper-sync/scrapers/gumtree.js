/**
 * Gumtree Scraper
 * Real implementation with pagination support
 */
import { BrowserManager } from "../utils/browserManager.js";
export class GumtreeScraper {
    browserManager;
    config;
    BASE_URL = "https://www.gumtree.com";
    constructor(config) {
        this.browserManager = new BrowserManager();
        this.config = config;
    }
    async scrape() {
        const startTime = Date.now();
        const result = {
            marketplace: "gumtree",
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
            result.errors.push(`Gumtree scraper error: ${error.message}`);
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
        for (let pageNum = 1; pageNum <= this.config.max_pages; pageNum++) {
            const searchUrl = this.buildSearchUrl(query, pageNum);
            try {
                await page.goto(searchUrl, { waitUntil: "networkidle" });
                await this.browserManager.randomDelay(1000, 2000);
                const pageListings = await this.extractListingsFromPage(page);
                listings.push(...pageListings);
                if (pageListings.length === 0)
                    break;
                await this.browserManager.randomDelay(this.config.delay_min_ms, this.config.delay_max_ms);
            }
            catch (error) {
                console.error(`Error scraping Gumtree page ${pageNum}: ${error.message}`);
            }
        }
        return listings;
    }
    async extractListingsFromPage(page) {
        const listings = [];
        const listingElements = await page.$$('article.listing-maxi');
        for (const element of listingElements) {
            try {
                const listing = await this.extractListingData(page, element);
                if (listing)
                    listings.push(listing);
            }
            catch (error) {
                console.error(`Error extracting Gumtree listing: ${error.message}`);
            }
        }
        return listings;
    }
    async extractListingData(page, element) {
        try {
            const linkElement = await element.$('a.listing-link');
            if (!linkElement)
                return null;
            const href = await linkElement.getAttribute('href');
            const link = href?.startsWith('http') ? href : `${this.BASE_URL}${href}`;
            const titleElement = await element.$('h2.listing-title');
            const title = titleElement ? (await titleElement.textContent())?.trim() || "Untitled" : "Untitled";
            const priceElement = await element.$('h3.listing-price');
            const priceText = priceElement ? await priceElement.textContent() : "£0";
            const price = this.parsePrice(priceText || "£0");
            const locationElement = await element.$('span.listing-location');
            const location = locationElement ? (await locationElement.textContent())?.trim() : undefined;
            const imgElement = await element.$('img.listing-thumbnail');
            const imgSrc = imgElement ? await imgElement.getAttribute('src') : null;
            const images = imgSrc ? [imgSrc] : [];
            const timeElement = await element.$('span.listing-posted-date');
            const timestamp = timeElement
                ? (await timeElement.textContent())?.trim()
                : new Date().toISOString();
            const seller_id = this.extractIdFromUrl(link);
            return {
                title,
                price,
                currency: "GBP",
                link,
                images,
                seller_id,
                timestamp: new Date().toISOString(),
                location,
                condition: "unknown",
                marketplace: "gumtree",
            };
        }
        catch (error) {
            console.error(`Error extracting Gumtree listing data: ${error.message}`);
            return null;
        }
    }
    buildSearchUrl(query, page) {
        const params = new URLSearchParams({
            search_terms: query,
            page: page.toString(),
        });
        if (this.config.location) {
            params.set('search_location', this.config.location);
        }
        return `${this.BASE_URL}/search?${params.toString()}`;
    }
    parsePrice(priceText) {
        const cleaned = priceText.replace(/[^0-9.]/g, "");
        return parseFloat(cleaned) || 0;
    }
    extractIdFromUrl(url) {
        const match = url.match(/\/(\d+)$/);
        return match ? match[1] : Buffer.from(url).toString("base64").slice(0, 16);
    }
}
//# sourceMappingURL=gumtree.js.map