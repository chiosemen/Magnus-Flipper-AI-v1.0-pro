/**
 * OfferUp Crawler (Serverless-compatible)
 * OfferUp has an API but requires authentication
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { CrawlerSearchParams, CrawlerResult, CrawledListing } from './types';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Crawl OfferUp for listings
 */
export async function crawlOfferUp(
  params: CrawlerSearchParams
): Promise<CrawlerResult> {
  const scrapedAt = new Date().toISOString();
  const listings: CrawledListing[] = [];
  const errors: string[] = [];

  try {
    const searchUrl = buildOfferUpSearchUrl(params);

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // Parse OfferUp search results
    const extractedListings = extractOfferUpListings($);
    listings.push(...extractedListings);

    // Apply max results limit
    if (params.maxResults && listings.length > params.maxResults) {
      listings.splice(params.maxResults);
    }

    return {
      success: listings.length > 0,
      site: 'offerup',
      listings,
      errors: errors.length > 0 ? errors : undefined,
      totalFound: listings.length,
      scrapedAt,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      site: 'offerup',
      listings,
      errors,
      scrapedAt,
    };
  }
}

function buildOfferUpSearchUrl(params: CrawlerSearchParams): string {
  const baseUrl = 'https://offerup.com/search';
  const urlParams = new URLSearchParams();

  if (params.query) urlParams.set('q', params.query);
  if (params.minPrice) urlParams.set('price_min', params.minPrice.toString());
  if (params.maxPrice) urlParams.set('price_max', params.maxPrice.toString());

  if (params.location) {
    urlParams.set('lat', params.location.lat.toString());
    urlParams.set('lng', params.location.lng.toString());
    if (params.location.radius) {
      // OfferUp uses miles for radius
      urlParams.set('radius', params.location.radius.toString());
    }
  }

  return `${baseUrl}?${urlParams.toString()}`;
}

function extractOfferUpListings($: cheerio.CheerioAPI): CrawledListing[] {
  const listings: CrawledListing[] = [];

  // Note: OfferUp uses client-side rendering for most content
  // This simple scraper may not capture all listings
  // Consider using OfferUp API or a headless browser for production

  // Try to extract from server-rendered content or JSON-LD
  const scriptTags = $('script[type="application/ld+json"]');
  scriptTags.each((_, element) => {
    try {
      const json = JSON.parse($(element).html() || '{}');
      if (json['@type'] === 'Product' || json['@type'] === 'ItemList') {
        // Extract product data from structured data
        if (json.itemListElement) {
          json.itemListElement.forEach((item: any) => {
            const product = item.item || item;
            const listing: CrawledListing = {
              externalId: product.sku || product.productID || '',
              site: 'offerup',
              url: product.url || '',
              title: product.name || '',
              price: parseFloat(product.offers?.price || '0'),
              currency: product.offers?.priceCurrency || 'USD',
              description: product.description || undefined,
              imageUrls: product.image ? [product.image] : undefined,
              scrapedAt: new Date().toISOString(),
              metadata: {
                source: 'offerup_structured_data',
              },
            };
            if (listing.externalId && listing.title) {
              listings.push(listing);
            }
          });
        }
      }
    } catch (error) {
      console.warn('Failed to parse OfferUp structured data:', error);
    }
  });

  // Fallback: try to extract from HTML elements
  if (listings.length === 0) {
    $('.product-card, [data-testid="product-card"]').each((_, element) => {
      try {
        const $el = $(element);
        const title = $el.find('.product-title, h2, h3').first().text().trim();
        const priceText = $el.find('.product-price, [data-testid="price"]').first().text().trim();
        const priceMatch = priceText.match(/\$?([\d,]+)/);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
        const url = $el.find('a').first().attr('href') || '';
        const imageUrl = $el.find('img').first().attr('src') || undefined;

        if (title && price > 0) {
          const listing: CrawledListing = {
            externalId: url.split('/').pop() || '',
            site: 'offerup',
            url: url.startsWith('http') ? url : `https://offerup.com${url}`,
            title,
            price,
            currency: 'USD',
            imageUrls: imageUrl ? [imageUrl] : undefined,
            scrapedAt: new Date().toISOString(),
            metadata: {
              source: 'offerup_html',
            },
          };
          listings.push(listing);
        }
      } catch (error) {
        console.warn('Failed to parse OfferUp listing:', error);
      }
    });
  }

  return listings;
}
