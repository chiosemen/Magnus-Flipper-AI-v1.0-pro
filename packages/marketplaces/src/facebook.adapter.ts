import type { MarketplaceAdapter, NormalizedListing } from './types';
import axios from 'axios';

/**
 * Facebook Marketplace Adapter
 * 
 * MVP: Hydrates listing data from a Facebook Marketplace URL
 * 
 * Note: Full scraping requires authentication and is ToS-sensitive.
 * This adapter focuses on URL hydration for user-submitted links.
 */
export class FacebookAdapter implements MarketplaceAdapter {
  /**
   * Extract listing ID from Facebook Marketplace URL
   */
  private extractListingId(url: string): string | null {
    try {
      // Facebook Marketplace URLs can be:
      // - https://www.facebook.com/marketplace/item/{id}
      // - https://www.facebook.com/marketplace/{user_id}/item/{id}
      const match = url.match(/marketplace\/.*?\/item\/(\d+)/) || 
                   url.match(/marketplace\/item\/(\d+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Hydrate a listing from a Facebook Marketplace URL
   * 
   * For MVP, we extract what we can from the URL and store minimal data.
   * Full hydration would require:
   * - Browser automation (Puppeteer/Playwright)
   * - Authentication
   * - Risk of ToS violations
   * 
   * This implementation stores the URL and marks status as 'unknown' if hydration fails.
   */
  async hydrate(url: string): Promise<NormalizedListing | null> {
    const listingId = this.extractListingId(url);
    
    if (!listingId) {
      // Invalid URL format - still store it but mark as unknown
      return {
        marketplace: 'facebook',
        externalId: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url,
        title: 'Unknown Listing',
        price: 0,
        currency: 'USD',
        status: 'unknown',
        raw: { url, error: 'Invalid URL format' },
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      };
    }

    try {
      // Attempt basic hydration via public API or meta tags
      // For MVP, we'll do minimal extraction
      // In production, you might use:
      // - Facebook Graph API (requires auth)
      // - Browser automation with proper rate limiting
      // - Third-party provider (Apify, Bright Data)
      
      // For now, we'll make a minimal request to check if URL is accessible
      // and extract basic info if possible
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Accept redirects and client errors
      });

      // Extract title from HTML if possible
      let title = 'Facebook Marketplace Listing';
      let price = 0;
      let currency = 'USD';
      let locationText: string | undefined;
      let imageUrl: string | undefined;

      if (response.status === 200 && response.data) {
        const html = response.data;
        
        // Try to extract title from meta tags or HTML
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                         html.match(/property="og:title"[^>]*content="([^"]+)"/i);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }

        // Try to extract price
        const priceMatch = html.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/) ||
                          html.match(/price["\s:]+(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(/,/g, ''));
        }

        // Try to extract location
        const locationMatch = html.match(/location["\s:]+([^<"]+)/i);
        if (locationMatch) {
          locationText = locationMatch[1].trim();
        }

        // Try to extract image
        const imageMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i);
        if (imageMatch) {
          imageUrl = imageMatch[1];
        }
      }

      return {
        marketplace: 'facebook',
        externalId: `fb_${listingId}`,
        url,
        title: title !== 'Facebook Marketplace Listing' ? title : `Facebook Listing ${listingId}`,
        price,
        currency,
        locationText,
        imageUrl,
        status: response.status === 200 ? 'active' : 'unknown',
        raw: {
          url,
          listingId,
          httpStatus: response.status,
          extracted: {
            title: title !== 'Facebook Marketplace Listing',
            price: price > 0,
            location: !!locationText,
            image: !!imageUrl,
          },
        },
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      };
    } catch (error: any) {
      // If hydration fails, still store the URL for later retry
      return {
        marketplace: 'facebook',
        externalId: `fb_${listingId || Date.now()}`,
        url,
        title: 'Facebook Marketplace Listing',
        price: 0,
        currency: 'USD',
        status: 'unknown',
        raw: {
          url,
          error: error.message || 'Hydration failed',
          listingId: listingId || null,
        },
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      };
    }
  }
}
