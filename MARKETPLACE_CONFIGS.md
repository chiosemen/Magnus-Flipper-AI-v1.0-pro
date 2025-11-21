# 🛒 Marketplace-Specific Configuration Guide

**Last Updated**: November 20, 2025

This guide covers platform-specific settings, credentials, and best practices for crawling different marketplaces.

---

## Table of Contents

1. [Facebook Marketplace](#facebook-marketplace)
2. [Vinted](#vinted)
3. [Gumtree](#gumtree)
4. [eBay](#ebay)
5. [Depop](#depop)
6. [General Best Practices](#general-best-practices)

---

## Facebook Marketplace

### Overview
Facebook Marketplace requires browser automation due to dynamic JavaScript rendering and anti-bot protection.

### Configuration

```bash
# Optional proxy for rate limiting avoidance
FB_MARKETPLACE_PROXY_URL=http://proxy-server:8080

# Optional: Custom user agent
FB_USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
```

### Browser Settings

```javascript
// In packages/crawlers/fb-marketplace/src/crawler.js
const browser = await chromium.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
  ],
  proxy: process.env.FB_MARKETPLACE_PROXY_URL ? {
    server: process.env.FB_MARKETPLACE_PROXY_URL
  } : undefined
});
```

### Rate Limiting
- **Recommended delay**: 2-3 seconds between page requests
- **Max concurrent searches**: 3-5
- **Daily limit**: ~500 searches per IP

### Anti-Detection Tips
1. Rotate user agents
2. Use residential proxies if needed
3. Add random delays: `await page.waitForTimeout(2000 + Math.random() * 1000)`
4. Clear cookies between sessions

### Common Issues

**Issue**: "You're going too fast"
- **Solution**: Increase delays, reduce concurrency

**Issue**: Login required
- **Solution**: Use cookies from authenticated session (handle carefully)

---

## Vinted

### Overview
Vinted has a public API that can be used for some endpoints, but web scraping may be needed for detailed listings.

### Configuration

```bash
# API access (if available)
VINTED_API_KEY=your_api_key_here
VINTED_API_BASE=https://www.vinted.co.uk/api/v2

# Geographic settings
VINTED_COUNTRY=uk
VINTED_CURRENCY=GBP
```

### API Endpoints (if using API)

```javascript
// Search endpoint
GET https://www.vinted.co.uk/api/v2/catalog/items
?search_text={query}
&price_from={min}
&price_to={max}
&order=newest_first

// Headers required
{
  'User-Agent': 'Mozilla/5.0...',
  'Accept': 'application/json',
  'x-vinted-locale': 'en-GB'
}
```

### Scraping Settings

```javascript
const page = await context.newPage();
await page.goto(`https://www.vinted.co.uk/catalog?search_text=${query}`);
await page.waitForSelector('.feed-grid__item');
```

### Rate Limiting
- **API**: 10 requests/second (if using API)
- **Scraping**: 1-2 seconds between requests
- **Max results per search**: 100 items

### Common Issues

**Issue**: Geo-blocked content
- **Solution**: Use UK-based proxies for vinted.co.uk

**Issue**: Currency conversion
- **Solution**: Store in original currency, convert in analysis worker

---

## Gumtree

### Overview
Gumtree UK classifieds - relatively straightforward to scrape but requires careful pagination handling.

### Configuration

```bash
# Geographic focus
GUMTREE_COUNTRY=uk
GUMTREE_BASE_URL=https://www.gumtree.com

# Optional authentication (for posting, not needed for reading)
GUMTREE_USERNAME=your_username
GUMTREE_PASSWORD=your_password
```

### Scraping Settings

```javascript
// Search URL pattern
const searchUrl = `https://www.gumtree.com/search?search_category=all&q=${query}&search_location=${location}&distance=5`;

// Wait for listings
await page.waitForSelector('.listing-link');

// Extract data
const listings = await page.$$eval('.listing-link', elements => {
  return elements.map(el => ({
    title: el.querySelector('.listing-title')?.textContent,
    price: el.querySelector('.listing-price')?.textContent,
    url: el.href
  }));
});
```

### Rate Limiting
- **Recommended delay**: 1-2 seconds
- **Max pages per search**: 25 pages (25 items per page)
- **Daily searches**: ~1000 per IP

### Common Issues

**Issue**: Pagination breaks
- **Solution**: Check for "Next page" button, don't assume fixed number of pages

**Issue**: Sponsored listings mixed with results
- **Solution**: Filter by `.listing-premium` class

---

## eBay

### Overview
eBay has official APIs but also allows scraping for personal use. API recommended for production.

### Configuration

```bash
# eBay API (recommended)
EBAY_API_KEY=your_api_key
EBAY_API_SECRET=your_api_secret
EBAY_SITE_ID=3  # UK = 3, US = 0

# For scraping
EBAY_BASE_URL=https://www.ebay.co.uk
```

### Using eBay Finding API

```javascript
const axios = require('axios');

const response = await axios.get('https://svcs.ebay.com/services/search/FindingService/v1', {
  params: {
    'OPERATION-NAME': 'findItemsAdvanced',
    'SERVICE-VERSION': '1.0.0',
    'SECURITY-APPNAME': process.env.EBAY_API_KEY,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'keywords': query,
    'priceCurrencyId': 'GBP',
    'itemFilter(0).name': 'MinPrice',
    'itemFilter(0).value': minPrice,
    'itemFilter(1).name': 'MaxPrice',
    'itemFilter(1).value': maxPrice
  }
});
```

### Rate Limiting
- **API**: 5000 calls/day (free tier)
- **Scraping**: 2-3 seconds between requests
- **Results per call**: Max 100 items

### Common Issues

**Issue**: API rate limit exceeded
- **Solution**: Implement caching, reduce search frequency

**Issue**: Auction vs Buy It Now
- **Solution**: Filter by listing type in API request

---

## Depop

### Overview
Fashion-focused marketplace popular with Gen Z. App-based with web version available.

### Configuration

```bash
# Geographic settings
DEPOP_COUNTRY=uk
DEPOP_BASE_URL=https://www.depop.com

# Optional: Category filters
DEPOP_CATEGORIES=menswear,womenswear,vintage
```

### Scraping Settings

```javascript
// Search endpoint
const url = `https://www.depop.com/products/?q=${query}&categories[]=${category}`;

await page.goto(url);
await page.waitForSelector('[data-testid="product__item"]');

const products = await page.$$eval('[data-testid="product__item"]', els => {
  return els.map(el => ({
    title: el.querySelector('p')?.textContent,
    price: el.querySelector('[data-testid="price"]')?.textContent,
    image: el.querySelector('img')?.src
  }));
});
```

### Rate Limiting
- **Recommended delay**: 2-3 seconds
- **Max results**: 50 per page
- **Authentication**: Not required for browsing

### Common Issues

**Issue**: Infinite scroll
- **Solution**: Use Playwright's auto-scroll or pagination API

**Issue**: Sold items in results
- **Solution**: Filter by availability status

---

## General Best Practices

### 1. User Agent Rotation

```javascript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36...'
];

const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
await page.setUserAgent(randomUA);
```

### 2. Respect robots.txt

```bash
# Check each marketplace's robots.txt
curl https://www.facebook.com/robots.txt
curl https://www.vinted.co.uk/robots.txt
curl https://www.gumtree.com/robots.txt
```

### 3. Error Handling

```javascript
async function safelyScrapePage(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await scrapePage(url);
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000 * (i + 1)));
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 4. Data Normalization

```javascript
function normalizePrice(priceString, currency = 'GBP') {
  // Remove currency symbols and convert to number
  const price = parseFloat(priceString.replace(/[£$€,]/g, ''));
  return { price, currency };
}

function normalizeLocation(locationString) {
  // Extract city from "London, Greater London" format
  return locationString.split(',')[0].trim();
}
```

### 5. Proxy Configuration

```javascript
// Rotating proxies
const proxies = process.env.PROXY_LIST?.split(',') || [];
const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];

const browser = await chromium.launch({
  proxy: randomProxy ? { server: randomProxy } : undefined
});
```

### 6. Monitoring & Alerts

```javascript
// Track success/failure rates
const metrics = {
  total: 0,
  successful: 0,
  failed: 0,
  avgTime: 0
};

// Alert if failure rate > 20%
if (metrics.failed / metrics.total > 0.2) {
  console.error('⚠️ High failure rate detected!');
  // Send alert to monitoring system
}
```

---

## Environment Variable Summary

```bash
# Core (Required)
REDIS_URL=redis://localhost:6379
SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=key

# Facebook Marketplace
FB_MARKETPLACE_PROXY_URL=http://proxy:8080
FB_USER_AGENT=Mozilla/5.0...

# Vinted
VINTED_API_KEY=key
VINTED_COUNTRY=uk
VINTED_CURRENCY=GBP

# Gumtree
GUMTREE_COUNTRY=uk
GUMTREE_BASE_URL=https://www.gumtree.com

# eBay
EBAY_API_KEY=key
EBAY_API_SECRET=secret
EBAY_SITE_ID=3

# Depop
DEPOP_COUNTRY=uk
DEPOP_CATEGORIES=menswear,womenswear

# General
WORKER_CONCURRENCY=3
REQUEST_TIMEOUT=30000
MAX_RETRIES=3
PROXY_LIST=http://proxy1:8080,http://proxy2:8080
```

---

## Testing Configuration

```bash
# Test Facebook Marketplace
node -e "
const { crawlFacebookMarketplace } = require('./packages/crawlers/fb-marketplace');
crawlFacebookMarketplace({
  searchTerm: 'ps5',
  location: 'London',
  minPrice: 100,
  maxPrice: 500
}).then(r => console.log('Found:', r.length, 'listings'));
"

# Test with different marketplaces
MARKETPLACE=vinted node scripts/test-crawler.js
MARKETPLACE=gumtree node scripts/test-crawler.js
```

---

## Legal & Compliance

### Terms of Service
- ✅ **Facebook**: Scraping permitted for personal use
- ⚠️ **eBay**: Use official API when possible
- ⚠️ **Vinted**: Check ToS for commercial use
- ✅ **Gumtree**: Generally permits scraping
- ⚠️ **Depop**: App-focused, may restrict scraping

### GDPR Considerations
- Only collect publicly available data
- Don't store personal information unnecessarily
- Provide data deletion upon request
- Document data retention policies

### Rate Limiting Ethics
- Respect platform resources
- Don't overwhelm servers
- Use caching to reduce requests
- Implement exponential backoff

---

**For adding new marketplaces**: Copy this template and fill in platform-specific details.

**Status**: Production Ready ✅
