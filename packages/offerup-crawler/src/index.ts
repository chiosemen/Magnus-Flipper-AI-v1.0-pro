/**
 * OfferUp Marketplace Crawler
 * Enhanced scraping with multiple fallback strategies
 *
 * Note: OfferUp uses heavy client-side rendering. For production use:
 * - Consider using OfferUp's API if available
 * - Use Puppeteer/Playwright for client-side rendered content
 * - Or use a service like Browserless.io
 */
import axios from 'axios';
import * as cheerio from 'cheerio';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface OfferUpSearchParams {
  query: string;
  location?: {
    lat?: number;
    lng?: number;
    radius?: number;
  };
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  maxResults?: number;
}

export interface OfferUpListing {
  id: string;
  title: string;
  price: number;
  url: string;
  location?: string;
  postedAt?: string;
  image?: string;
  condition?: string;
  description?: string;
}

export interface OfferUpResult {
  success: boolean;
  listings: OfferUpListing[];
  totalFound: number;
  error?: string;
  warning?: string;
}

/**
 * Main scrape function
 */
export async function scrape(searchParams: OfferUpSearchParams): Promise<OfferUpResult> {
  try {
    const searchUrl = buildSearchUrl(searchParams);

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // Try multiple extraction strategies
    let listings = extractFromStructuredData($);

    if (listings.length === 0) {
      listings = extractFromHTML($);
    }

    // Apply max results limit
    if (searchParams.maxResults && listings.length > searchParams.maxResults) {
      listings.splice(searchParams.maxResults);
    }

    const warning = listings.length === 0
      ? 'OfferUp uses client-side rendering. Consider using Puppeteer or OfferUp API for better results.'
      : undefined;

    return {
      success: listings.length > 0,
      listings,
      totalFound: listings.length,
      warning,
    };
  } catch (error) {
    return {
      success: false,
      listings: [],
      totalFound: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function buildSearchUrl(params: OfferUpSearchParams): string {
  const baseUrl = 'https://offerup.com/search';
  const urlParams = new URLSearchParams();

  if (params.query) urlParams.set('q', params.query);
  if (params.minPrice) urlParams.set('price_min', params.minPrice.toString());
  if (params.maxPrice) urlParams.set('price_max', params.maxPrice.toString());

  if (params.location) {
    if (params.location.lat) urlParams.set('lat', params.location.lat.toString());
    if (params.location.lng) urlParams.set('lng', params.location.lng.toString());
    if (params.location.radius) urlParams.set('radius', params.location.radius.toString());
  }

  if (params.category) {
    urlParams.set('category', mapCategory(params.category));
  }

  return `${baseUrl}?${urlParams.toString()}`;
}

function mapCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'all': '',
    'phones': 'cell-phones-smartphones',
    'laptops': 'computers-laptops',
    'cars': 'cars-trucks',
    'motorcycles': 'motorcycles',
    'electronics': 'electronics',
    'cameras': 'cameras-photography',
    'gaming': 'video-games-consoles',
    'appliances': 'appliances',
    'furniture': 'furniture',
    'jewelry': 'jewelry-accessories',
    'clothing': 'clothing-shoes',
    'sports': 'sporting-goods',
    'tools': 'tools-machinery',
  };

  return categoryMap[category.toLowerCase()] || '';
}

/**
 * Extract listings from JSON-LD structured data
 */
function extractFromStructuredData($: cheerio.CheerioAPI): OfferUpListing[] {
  const listings: OfferUpListing[] = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const json = JSON.parse($(element).html() || '{}');

      // Handle ItemList type
      if (json['@type'] === 'ItemList' && json.itemListElement) {
        json.itemListElement.forEach((item: any) => {
          const product = item.item || item;
          const listing = parseProduct(product);
          if (listing) listings.push(listing);
        });
      }

      // Handle single Product type
      if (json['@type'] === 'Product') {
        const listing = parseProduct(json);
        if (listing) listings.push(listing);
      }
    } catch (error) {
      // Silently continue to next script tag
    }
  });

  return listings;
}

function parseProduct(product: any): OfferUpListing | null {
  try {
    const id = product.sku || product.productID || product['@id'] || '';
    const title = product.name || '';
    const price = parseFloat(product.offers?.price || product.price || '0');
    const url = product.url || '';
    const image = Array.isArray(product.image) ? product.image[0] : product.image;
    const description = product.description || undefined;

    if (!id || !title || !price) return null;

    return {
      id: id.toString(),
      title,
      price,
      url: url.startsWith('http') ? url : `https://offerup.com${url}`,
      image,
      description,
      condition: product.itemCondition || undefined,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Extract listings from HTML elements (fallback)
 */
function extractFromHTML($: cheerio.CheerioAPI): OfferUpListing[] {
  const listings: OfferUpListing[] = [];

  // Try multiple possible selectors
  const selectors = [
    '.product-card',
    '[data-testid="product-card"]',
    '[data-testid="listing-card"]',
    'article[data-id]',
    'div[data-item-id]',
    '.item-card',
    '.listing-card',
  ];

  for (const selector of selectors) {
    $(selector).each((_, element) => {
      try {
        const $el = $(element);

        // Extract ID
        const id = $el.attr('data-id') ||
                   $el.attr('data-item-id') ||
                   $el.find('a').first().attr('href')?.split('/').pop() || '';

        // Extract title
        const title = $el.find('.product-title, .item-title, h2, h3, [data-testid="title"]')
          .first()
          .text()
          .trim();

        // Extract price
        const priceText = $el.find('.product-price, .item-price, [data-testid="price"], .price')
          .first()
          .text()
          .trim();
        const priceMatch = priceText.match(/\$?([\d,]+(?:\.\d{2})?)/);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

        // Extract URL
        const url = $el.find('a').first().attr('href') || '';

        // Extract image
        const image = $el.find('img').first().attr('src') ||
                     $el.find('img').first().attr('data-src') ||
                     undefined;

        // Extract location
        const location = $el.find('.location, .item-location, [data-testid="location"]')
          .first()
          .text()
          .trim() || undefined;

        // Extract condition
        const condition = $el.find('.condition, .item-condition')
          .first()
          .text()
          .trim() || undefined;

        if (id && title && price > 0) {
          listings.push({
            id: id.toString(),
            title,
            price,
            url: url.startsWith('http') ? url : `https://offerup.com${url}`,
            image,
            location,
            condition,
          });
        }
      } catch (error) {
        // Continue to next element
      }
    });

    // If we found listings with this selector, return them
    if (listings.length > 0) break;
  }

  return listings;
}

/**
 * Alternative: Use OfferUp's internal API (if available)
 * This is a placeholder for future implementation
 */
export async function scrapeWithAPI(searchParams: OfferUpSearchParams): Promise<OfferUpResult> {
  // TODO: Implement OfferUp API integration if API access is available
  // This would require authentication and API key
  return {
    success: false,
    listings: [],
    totalFound: 0,
    error: 'OfferUp API integration not yet implemented',
  };
}
