/**
 * Craigslist Crawler (Serverless-compatible)
 * Craigslist allows HTTP scraping of public listings
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { CrawlerSearchParams, CrawlerResult, CrawledListing } from './types';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Craigslist city subdomains mapping
const CITY_SUBDOMAINS: Record<string, string> = {
  'san francisco': 'sfbay',
  'new york': 'newyork',
  'los angeles': 'losangeles',
  'chicago': 'chicago',
  'seattle': 'seattle',
  'boston': 'boston',
  'austin': 'austin',
  'denver': 'denver',
  'atlanta': 'atlanta',
  'miami': 'miami',
  'phoenix': 'phoenix',
  'portland': 'portland',
  'dallas': 'dallas',
  'houston': 'houston',
};

/**
 * Crawl Craigslist for listings
 */
export async function crawlCraigslist(
  params: CrawlerSearchParams
): Promise<CrawlerResult> {
  const scrapedAt = new Date().toISOString();
  const listings: CrawledListing[] = [];
  const errors: string[] = [];

  try {
    const searchUrl = buildCraigslistSearchUrl(params);

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // Parse Craigslist search results
    const extractedListings = extractCraigslistListings($, params);
    listings.push(...extractedListings);

    // Apply max results limit
    if (params.maxResults && listings.length > params.maxResults) {
      listings.splice(params.maxResults);
    }

    return {
      success: true,
      site: 'craigslist',
      listings,
      errors: errors.length > 0 ? errors : undefined,
      totalFound: listings.length,
      scrapedAt,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      site: 'craigslist',
      listings,
      errors,
      scrapedAt,
    };
  }
}

function buildCraigslistSearchUrl(params: CrawlerSearchParams): string {
  // Default to San Francisco Bay Area if no location specified
  const subdomain = params.location ? guessSubdomain(params.location) : 'sfbay';

  // Determine category (default to 'sss' for all for sale)
  const category = mapCategoryToCraigslist(params.category || 'all');

  const baseUrl = `https://${subdomain}.craigslist.org/search/${category}`;
  const urlParams = new URLSearchParams();

  if (params.query) urlParams.set('query', params.query);
  if (params.minPrice) urlParams.set('min_price', params.minPrice.toString());
  if (params.maxPrice) urlParams.set('max_price', params.maxPrice.toString());

  // Craigslist uses search_distance for radius
  if (params.location?.radius) {
    urlParams.set('search_distance', params.location.radius.toString());
  }

  return `${baseUrl}?${urlParams.toString()}`;
}

function guessSubdomain(location: { lat: number; lng: number }): string {
  // Simple location-to-subdomain mapping based on lat/lng
  // San Francisco Bay Area coordinates
  if (
    location.lat > 37.0 &&
    location.lat < 38.0 &&
    location.lng > -123.0 &&
    location.lng < -121.0
  ) {
    return 'sfbay';
  }
  // New York coordinates
  if (
    location.lat > 40.0 &&
    location.lat < 41.0 &&
    location.lng > -75.0 &&
    location.lng < -73.0
  ) {
    return 'newyork';
  }
  // Los Angeles coordinates
  if (
    location.lat > 33.0 &&
    location.lat < 34.5 &&
    location.lng > -119.0 &&
    location.lng < -117.0
  ) {
    return 'losangeles';
  }
  // Default to SF Bay
  return 'sfbay';
}

function mapCategoryToCraigslist(category: string): string {
  const categoryMap: Record<string, string> = {
    'all': 'sss',
    'phones': 'moa', // mobile phones
    'laptops': 'sya', // computers
    'cars': 'cta', // cars & trucks
    'motorcycles': 'mca', // motorcycles
    'electronics': 'ela', // electronics
    'cameras': 'pha', // photo/video
    'gaming': 'vga', // video gaming
    'appliances': 'ppa', // appliances
    'furniture': 'fua', // furniture
    'jewelry': 'jwa', // jewelry
  };

  return categoryMap[category.toLowerCase()] || 'sss';
}

function extractCraigslistListings(
  $: cheerio.CheerioAPI,
  params: CrawlerSearchParams
): CrawledListing[] {
  const listings: CrawledListing[] = [];

  // Craigslist uses .result-row class for search results
  $('.result-row, .cl-search-result').each((_, element) => {
    try {
      const $el = $(element);

      // Extract listing URL and ID
      const link = $el.find('a.result-title, a.main').first();
      const url = link.attr('href') || '';
      const title = link.text().trim();

      // Extract ID from URL or data attribute
      const idMatch = url.match(/\/(\d+)\.html/);
      const externalId = idMatch ? idMatch[1] : '';

      if (!externalId || !title) return;

      // Extract price
      const priceText = $el.find('.result-price, .priceinfo').first().text().trim();
      const priceMatch = priceText.match(/\$?([\d,]+)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

      // Extract location
      const locationText = $el.find('.result-hood, .location').first().text().trim();

      // Extract date posted
      const dateElement = $el.find('time');
      const postedAt = dateElement.attr('datetime') || new Date().toISOString();

      // Build full URL if relative
      const fullUrl = url.startsWith('http') ? url : `https://craigslist.org${url}`;

      const listing: CrawledListing = {
        externalId,
        site: 'craigslist',
        url: fullUrl,
        title,
        price,
        currency: 'USD',
        location: locationText || undefined,
        postedAt,
        scrapedAt: new Date().toISOString(),
        metadata: {
          source: 'craigslist_search',
        },
      };

      listings.push(listing);
    } catch (error) {
      console.warn('Failed to parse Craigslist listing:', error);
    }
  });

  return listings;
}
