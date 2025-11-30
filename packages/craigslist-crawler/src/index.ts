/**
 * Craigslist Marketplace Crawler
 * HTTP-based scraping of public Craigslist listings
 */
import axios from 'axios';
import * as cheerio from 'cheerio';

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

export interface CraigslistSearchParams {
  query: string;
  location?: {
    lat?: number;
    lng?: number;
    radius?: number;
    city?: string;
  };
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  maxResults?: number;
}

export interface CraigslistListing {
  id: string;
  title: string;
  price: number;
  url: string;
  location?: string;
  postedAt?: string;
  image?: string;
  condition?: string;
}

export interface CraigslistResult {
  success: boolean;
  listings: CraigslistListing[];
  totalFound: number;
  error?: string;
}

/**
 * Main scrape function
 */
export async function scrape(searchParams: CraigslistSearchParams): Promise<CraigslistResult> {
  try {
    const searchUrl = buildSearchUrl(searchParams);

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const listings = extractListings($, searchParams);

    // Apply max results limit
    if (searchParams.maxResults && listings.length > searchParams.maxResults) {
      listings.splice(searchParams.maxResults);
    }

    return {
      success: true,
      listings,
      totalFound: listings.length,
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

function buildSearchUrl(params: CraigslistSearchParams): string {
  // Determine subdomain
  let subdomain = 'sfbay'; // default
  if (params.location?.city) {
    subdomain = CITY_SUBDOMAINS[params.location.city.toLowerCase()] || 'sfbay';
  } else if (params.location?.lat && params.location?.lng) {
    subdomain = guessSubdomainFromCoordinates(params.location.lat, params.location.lng);
  }

  // Determine category
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

function guessSubdomainFromCoordinates(lat: number, lng: number): string {
  // San Francisco Bay Area
  if (lat > 37.0 && lat < 38.0 && lng > -123.0 && lng < -121.0) {
    return 'sfbay';
  }
  // New York
  if (lat > 40.0 && lat < 41.0 && lng > -75.0 && lng < -73.0) {
    return 'newyork';
  }
  // Los Angeles
  if (lat > 33.0 && lat < 34.5 && lng > -119.0 && lng < -117.0) {
    return 'losangeles';
  }
  // Chicago
  if (lat > 41.5 && lat < 42.5 && lng > -88.5 && lng < -87.0) {
    return 'chicago';
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
    'clothing': 'cla', // clothing
    'books': 'bka', // books
    'sports': 'sga', // sporting goods
    'tools': 'tla', // tools
  };

  return categoryMap[category.toLowerCase()] || 'sss';
}

function extractListings(
  $: cheerio.CheerioAPI,
  params: CraigslistSearchParams
): CraigslistListing[] {
  const listings: CraigslistListing[] = [];

  // Craigslist uses .result-row or .cl-search-result classes
  $('.result-row, .cl-search-result, .cl-static-search-result').each((_, element) => {
    try {
      const $el = $(element);

      // Extract listing URL and title
      const link = $el.find('a.result-title, a.main, a.titlestring').first();
      const url = link.attr('href') || '';
      const title = link.text().trim();

      // Extract ID from URL
      const idMatch = url.match(/\/(\d+)\.html/);
      const id = idMatch ? idMatch[1] : '';

      if (!id || !title) return;

      // Extract price
      const priceText = $el.find('.result-price, .priceinfo, .price').first().text().trim();
      const priceMatch = priceText.match(/\$?([\d,]+)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

      // Extract location
      const locationText = $el.find('.result-hood, .location, .meta .location').first().text().trim();
      const location = locationText.replace(/[()]/g, '').trim();

      // Extract date posted
      const dateElement = $el.find('time');
      const postedAt = dateElement.attr('datetime') || undefined;

      // Extract image
      const imageElement = $el.find('img');
      const image = imageElement.attr('src') || undefined;

      // Build full URL if relative
      const fullUrl = url.startsWith('http') ? url : `https://craigslist.org${url}`;

      const listing: CraigslistListing = {
        id,
        title,
        price,
        url: fullUrl,
        location: location || undefined,
        postedAt,
        image,
      };

      listings.push(listing);
    } catch (error) {
      console.warn('Failed to parse Craigslist listing:', error);
    }
  });

  return listings;
}
