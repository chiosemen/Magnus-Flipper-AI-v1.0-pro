const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
const { saveListings } = require("./storage");
const { loadCookies } = require("./auth");
const { randomDelay, humanScroll } = require("./antiBan");
const { buildSearchUrl } = require("./urlBuilder");
const { calculateUndervalueScore, calculateQuickFlipScore, calculateDemandVelocity, calculateRarityScore, calculateProfitabilityScore, getEstimatedResaleValue } = require('@magnus-flipper-ai/valuation-engine');
const { detectChanges } = require('@magnus-flipper-ai/sniper-engine');


chromium.use(stealth);

async function crawlFacebookMarketplace(profile) {
  let browser;
  try {
    console.log(`[FB Crawler] Launching browser for profile: ${profile.id}`);
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
      ],
    });

    console.log(`[FB Crawler] Creating new browser context for profile: ${profile.id}`);
    const context = await browser.newContext();
    const cookies = await loadCookies();
    await context.addCookies(cookies);

    const page = await context.newPage();

    const city = profile.location || "london"; // Use profile location
    const searchParams = {
      query: profile.query || "",
      minPrice: profile.min_price,
      maxPrice: profile.max_price,
      // Add other profile conditions as needed
    };

    const searchUrl = buildSearchUrl(city, searchParams);
    console.log(`[FB Crawler] Navigating to: ${searchUrl}`);

    await page.goto(searchUrl);
    await randomDelay(1000, 3000); // Initial delay

    console.log("[FB Crawler] Waiting for listings to load...");
    await page.waitForSelector('div[data-testid="marketplace_feed_item"]');
    await humanScroll(page); // Human-like scrolling
    await randomDelay(1000, 3000); // Delay after scroll

    console.log("[FB Crawler] Scraping listings...");
    let listings = await page.$$eval('div[data-testid="marketplace_feed_item"]', (elements) =>
      elements.map((el) => {
        const title = el.querySelector('a[aria-label]')?.ariaLabel;
        const priceText = el.querySelector('span > div > span')?.textContent;
        const image = el.querySelector('img')?.src;
        const link = el.querySelector('a[aria-label]')?.href;
        const idMatch = link ? link.match(/\/item\/(\d+)/) : null;
        const id = idMatch ? idMatch[1] : null;
        // Placeholder for location, seller rating, timestamp - these often require more specific selectors
        const location = el.querySelector('span.x1lli2ws.x6ikm8r.x10wlt62.x1n2onr6.x1j85h84.x1ypdohk.x78zum5.x1t2pt76.x1fsd2vl.x1jk9b9i.x1lku1pv.x1rg5ohu.x16m7z9d.x1xmf6zcn.x1n2onr6.x1j85h84.x1ypdohk.x1t2pt76.x1fsd2vl.x1jk9b9i.x1lku1pv.x1rg5ohu.x16m7z9d.x1xmf6zcn') ? el.querySelector('span.x1lli2ws.x6ikm8r.x10wlt62.x1n2onr6.x1j85h84.x1ypdohk.x78zum5.x1t2pt76.x1fsd2vl.x1jk9b9i.x1lku1pv.x1rg5ohu.x16m7z9d.x1xmf6zcn.x1n2onr6.x1j85h84.x1ypdohk.x1t2pt76.x1fsd2vl.x1jk9b9i.x1lku1pv.x1rg5ohu.x16m7z9d.x1xmf6zcn').textContent : null;
        const sellerRating = null; // Complex to extract, often in a separate element or pop-up
        const timestamp = el.querySelector('span.x1lli2ws.x6ikm8r.x10wlt62.x1n2onr6.x1j85h84.x1ypdohk.x78zum5.x1t2pt76.x1fsd2vl.x1jk9b9i.x1lku1pv.x1rg5ohu.x16m7z9d.x1xmf6zcn.x1n2onr6.x1j85h84.x1ypdohk.x1t2pt76.x1fsd2vl.x1jk9b9i.x1lku1pv.x1rg5ohu.x16m7z9d.x1xmf6zcn') ? el.querySelector('span.x1lli2ws.x6ikm8r.x10wlt62.x1n2onr6.x1j85h84.x1ypdohk.x78zum5.x1t2pt76.x1fsd2vl.x1jk9b9i.x1lku1pv.x1rg5ohu.x16m7z9d.x1xmf6zcn.x1n2onr6.x1j85h84.x1ypdohk.x1t2pt76.x1fsd2vl.x1jk9b9i.x1lku1pv.x1rg5ohu.x16m7z9d.x1xmf6zcn').textContent : null;

        const price = parseFloat(priceText?.replace(/[^0-9.-]+/g, "")) || 0;

        return { id, title, price, image, link, location, sellerRating, timestamp };
      })
    );

    // Calculate scores for each listing
    listings = listings.map(listing => {
      const estimatedResaleValue = getEstimatedResaleValue(listing.title || '');
      const undervalueScore = calculateUndervalueScore(listing.price, estimatedResaleValue);
      const demandVelocity = calculateDemandVelocity(listing.title || '');
      const quickFlipScore = calculateQuickFlipScore(undervalueScore, demandVelocity);
      const rarityScore = calculateRarityScore(listing.title || '');
      const profitabilityScore = calculateProfitabilityScore(listing.price, estimatedResaleValue);

      return {
        ...listing,
        estimatedResaleValue,
        undervalueScore,
        quickFlipScore,
        demandVelocity,
        rarityScore,
        profitabilityScore,
      };
    });

    // In the new architecture, listings are enqueued for analysis, not saved directly here.
    // Alerts are also handled by a separate worker.
    // await saveListings(listings);
    // const { newAlerts, priceDropAlerts } = await detectChanges(city, searchParams.query, listings);
    // if (newAlerts.length > 0) { ... }
    // if (priceDropAlerts.length > 0) { ... }

    console.log(`[FB Crawler] Found ${listings.length} listings for profile: ${profile.id}`);
    return listings;

  } catch (error) {
    console.error(`[FB Crawler] An error occurred during scraping for profile ${profile.id}:`, error);
    throw error; // Re-throw to be caught by the worker
  } finally {
    if (browser) {
      console.log(`[FB Crawler] Closing browser for profile: ${profile.id}`);
      await browser.close();
    }
  }
}

module.exports = { crawlFacebookMarketplace };