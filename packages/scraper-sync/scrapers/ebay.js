/**
 * eBay Scraper
 * Real implementation with pagination, filtering, and condition detection
 */
import { BrowserManager } from "../utils/browserManager.js";
export class EbayScraper {
    browserManager;
    config;
    BASE_URL = "https://www.ebay.com";
    constructor(config) {
        this.browserManager = new BrowserManager();
        this.config = config;
    }
    /**
     * Main scrape method
     */
    async scrape() {
        const startTime = Date.now();
        const result = {
            marketplace: "ebay",
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
            // Scrape each search query
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
            result.errors.push(`eBay scraper error: ${error.message}`);
        }
        finally {
            if (page) {
                await page.close();
            }
            await this.browserManager.close();
            result.completed_at = new Date().toISOString();
            result.duration_ms = Date.now() - startTime;
        }
        return result;
    }
    /**
     * Scrape listings for a specific query
     */
    async scrapeQuery(page, query) {
        const listings = [];
        // Iterate through pages
        for (let pageNum = 1; pageNum <= this.config.max_pages; pageNum++) {
            const searchUrl = this.buildSearchUrl(query, pageNum);
            try {
                await page.goto(searchUrl, { waitUntil: "networkidle" });
                await this.browserManager.randomDelay(1000, 2000);
                // Wait for results to load
                try {
                    await page.waitForSelector('ul.srp-results', { timeout: 5000 });
                }
                catch {
                    // No results found
                    break;
                }
                // Extract listings from current page
                const pageListings = await this.extractListingsFromPage(page);
                listings.push(...pageListings);
                if (pageListings.length === 0) {
                    break;
                }
                await this.browserManager.randomDelay(this.config.delay_min_ms, this.config.delay_max_ms);
            }
            catch (error) {
                console.error(`Error scraping eBay page ${pageNum}: ${error.message}`);
            }
        }
        return listings;
    }
    /**
     * Extract listings from current page
     */
    async extractListingsFromPage(page) {
        const listings = [];
        // Get all listing items
        const listingElements = await page.$$('li.s-item');
        for (const element of listingElements) {
            try {
                const listing = await this.extractListingData(page, element);
                if (listing) {
                    listings.push(listing);
                }
            }
            catch (error) {
                console.error(`Error extracting eBay listing: ${error.message}`);
            }
        }
        return listings;
    }
    /**
     * Extract data from a listing element
     */
    async extractListingData(page, element) {
        try {
            // Get link
            const linkElement = await element.$('a.s-item__link');
            if (!linkElement)
                return null;
            const link = await linkElement.getAttribute('href');
            if (!link)
                return null;
            // Get title
            const titleElement = await element.$('div.s-item__title');
            const title = titleElement
                ? (await titleElement.textContent())?.trim() || "Untitled"
                : "Untitled";
            // Skip if this is a "shop on eBay" header item
            if (title.toLowerCase().includes('shop on ebay')) {
                return null;
            }
            // Get price
            const priceElement = await element.$('span.s-item__price');
            const priceText = priceElement
                ? await priceElement.textContent()
                : "$0";
            const price = this.parsePrice(priceText || "$0");
            // Get condition
            const conditionElement = await element.$('span.SECONDARY_INFO');
            const conditionText = conditionElement
                ? (await conditionElement.textContent())?.trim()
                : null;
            const condition = this.parseCondition(conditionText);
            // Get location
            const locationElement = await element.$('span.s-item__location');
            const location = locationElement
                ? (await locationElement.textContent())?.replace('From ', '').trim()
                : undefined;
            // Get shipping info
            const shippingElement = await element.$('span.s-item__shipping');
            const shippingText = shippingElement
                ? (await shippingElement.textContent())?.trim()
                : null;
            const { shipping_available, shipping_cost } = this.parseShipping(shippingText);
            // Get image
            const imgElement = await element.$('img.s-item__image-img');
            const imgSrc = imgElement ? await imgElement.getAttribute('src') : null;
            const images = imgSrc && !imgSrc.includes('placeholder') ? [imgSrc] : [];
            // Get seller info
            const sellerElement = await element.$('span.s-item__seller-info-text');
            const sellerText = sellerElement
                ? (await sellerElement.textContent())?.trim()
                : null;
            const seller_id = this.extractSellerId(sellerText) || this.extractListingIdFromUrl(link);
            // Get views (watching count)
            const watchingElement = await element.$('span.s-item__watchingCount');
            const watchingText = watchingElement
                ? await watchingElement.textContent()
                : null;
            const views_count = watchingText
                ? parseInt(watchingText.replace(/[^0-9]/g, ''), 10)
                : undefined;
            return {
                title,
                price,
                currency: "USD",
                link,
                images,
                seller_id,
                timestamp: new Date().toISOString(),
                location,
                condition,
                marketplace: "ebay",
                shipping_available,
                shipping_cost,
                views_count,
            };
        }
        catch (error) {
            console.error(`Error extracting eBay listing data: ${error.message}`);
            return null;
        }
    }
    /**
     * Build eBay search URL
     */
    buildSearchUrl(query, page = 1) {
        const params = new URLSearchParams({
            _nkw: query,
            _sop: '10', // Sort by newly listed
            _pgn: page.toString(),
        });
        if (this.config.min_price) {
            params.set('_udlo', this.config.min_price.toString());
        }
        if (this.config.max_price) {
            params.set('_udhi', this.config.max_price.toString());
        }
        // Add condition filters (used items only for better arbitrage)
        params.set('LH_ItemCondition', '3000'); // Used
        return `${this.BASE_URL}/sch/i.html?${params.toString()}`;
    }
    /**
     * Parse price from text
     */
    parsePrice(priceText) {
        // Handle price ranges (e.g., "$10 to $20")
        if (priceText.includes('to')) {
            const parts = priceText.split('to');
            const firstPrice = parts[0].replace(/[^0-9.]/g, '');
            return parseFloat(firstPrice) || 0;
        }
        const cleaned = priceText.replace(/[^0-9.]/g, '');
        return parseFloat(cleaned) || 0;
    }
    /**
     * Parse condition from text
     */
    parseCondition(conditionText) {
        if (!conditionText)
            return "unknown";
        const lower = conditionText.toLowerCase();
        if (lower.includes('new') && !lower.includes('open box'))
            return "new";
        if (lower.includes('open box') || lower.includes('like new'))
            return "like_new";
        if (lower.includes('excellent') || lower.includes('very good'))
            return "good";
        if (lower.includes('good'))
            return "good";
        if (lower.includes('acceptable') || lower.includes('fair'))
            return "fair";
        if (lower.includes('poor') || lower.includes('for parts'))
            return "poor";
        return "unknown";
    }
    /**
     * Parse shipping information
     */
    parseShipping(shippingText) {
        if (!shippingText) {
            return { shipping_available: false };
        }
        const lower = shippingText.toLowerCase();
        if (lower.includes('free')) {
            return { shipping_available: true, shipping_cost: 0 };
        }
        const match = shippingText.match(/\$([0-9.]+)/);
        if (match) {
            return {
                shipping_available: true,
                shipping_cost: parseFloat(match[1]),
            };
        }
        return { shipping_available: true };
    }
    /**
     * Extract seller ID from seller text
     */
    extractSellerId(sellerText) {
        if (!sellerText)
            return null;
        const match = sellerText.match(/\(([^)]+)\)/);
        if (match) {
            return match[1];
        }
        return null;
    }
    /**
     * Extract listing ID from eBay URL
     */
    extractListingIdFromUrl(url) {
        const match = url.match(/\/itm\/([^/?]+)/);
        if (match) {
            return match[1];
        }
        // Fallback
        return Buffer.from(url).toString("base64").slice(0, 16);
    }
}
//# sourceMappingURL=ebay.js.map