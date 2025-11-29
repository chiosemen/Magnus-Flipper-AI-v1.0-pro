/**
 * eBay Local Pickup Crawler (Serverless-compatible)
 * Uses eBay Finding API for authorized access
 */
import axios from 'axios';
import { CrawlerSearchParams, CrawlerResult, CrawledListing } from './types';

const EBAY_FINDING_API_URL = 'https://svcs.ebay.com/services/search/FindingService/v1';

/**
 * Crawl eBay for local pickup listings
 * Requires EBAY_APP_ID environment variable
 */
export async function crawlEbay(
  params: CrawlerSearchParams
): Promise<CrawlerResult> {
  const scrapedAt = new Date().toISOString();
  const listings: CrawledListing[] = [];
  const errors: string[] = [];

  const appId = process.env.EBAY_APP_ID;

  if (!appId) {
    errors.push('EBAY_APP_ID environment variable not set. Get one at: https://developer.ebay.com');
    return {
      success: false,
      site: 'ebay',
      listings,
      errors,
      scrapedAt,
    };
  }

  try {
    const response = await axios.get(EBAY_FINDING_API_URL, {
      params: {
        'OPERATION-NAME': 'findItemsAdvanced',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': '',
        'keywords': params.query,
        'itemFilter(0).name': 'LocatedIn',
        'itemFilter(0).value': 'US',
        'itemFilter(1).name': 'LocalPickupOnly',
        'itemFilter(1).value': 'true',
        ...(params.minPrice && {
          'itemFilter(2).name': 'MinPrice',
          'itemFilter(2).value': params.minPrice.toString(),
        }),
        ...(params.maxPrice && {
          'itemFilter(3).name': 'MaxPrice',
          'itemFilter(3).value': params.maxPrice.toString(),
        }),
        'paginationInput.entriesPerPage': params.maxResults?.toString() || '100',
      },
      timeout: 15000,
    });

    const data = response.data;
    const searchResult = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0];

    if (!searchResult || searchResult['@count'] === '0') {
      return {
        success: true,
        site: 'ebay',
        listings: [],
        totalFound: 0,
        scrapedAt,
      };
    }

    const items = searchResult.item || [];

    for (const item of items) {
      try {
        const listing: CrawledListing = {
          externalId: item.itemId?.[0] || '',
          site: 'ebay',
          url: item.viewItemURL?.[0] || '',
          title: item.title?.[0] || '',
          description: item.subtitle?.[0] || undefined,
          price: parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0'),
          currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] || 'USD',
          condition: item.condition?.[0]?.conditionDisplayName?.[0] || undefined,
          location: item.location?.[0] || undefined,
          imageUrls: item.galleryURL?.[0] ? [item.galleryURL[0]] : undefined,
          postedAt: item.listingInfo?.[0]?.startTime?.[0] || undefined,
          scrapedAt,
          metadata: {
            source: 'ebay_finding_api',
            listingType: item.listingInfo?.[0]?.listingType?.[0] || undefined,
            shippingType: item.shippingInfo?.[0]?.shippingType?.[0] || undefined,
            topRatedListing: item.topRatedListing?.[0] === 'true',
          },
        };

        if (listing.externalId && listing.title) {
          listings.push(listing);
        }
      } catch (error) {
        console.warn('Failed to parse eBay listing:', error);
      }
    }

    return {
      success: true,
      site: 'ebay',
      listings,
      totalFound: parseInt(searchResult['@count'] || '0', 10),
      scrapedAt,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      site: 'ebay',
      listings,
      errors,
      scrapedAt,
    };
  }
}
