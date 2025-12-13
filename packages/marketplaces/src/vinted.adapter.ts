import type { MarketplaceAdapter, NormalizedListing } from './types';
import axios from 'axios';

/**
 * Vinted Adapter
 * 
 * MVP: Hydrates listing data from a Vinted URL
 * 
 * Vinted has a public API that can be used with proper headers.
 * This adapter uses the API when possible, falling back to HTML parsing.
 */
export class VintedAdapter implements MarketplaceAdapter {
  /**
   * Extract item ID from Vinted URL
   */
  private extractItemId(url: string): string | null {
    try {
      // Vinted URLs: https://www.vinted.com/items/{id}
      const match = url.match(/\/items\/(\d+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Hydrate a listing from a Vinted URL
   */
  async hydrate(url: string): Promise<NormalizedListing | null> {
    const itemId = this.extractItemId(url);
    
    if (!itemId) {
      // Invalid URL format
      return {
        marketplace: 'vinted',
        externalId: `vinted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
      // Try Vinted API first (if available)
      // Vinted API endpoint: https://www.vinted.com/api/v2/items/{id}
      const apiUrl = `https://www.vinted.com/api/v2/items/${itemId}`;
      
      try {
        const response = await axios.get(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
          timeout: 10000,
        });

        if (response.data && response.data.item) {
          const item = response.data.item;
          
          return {
            marketplace: 'vinted',
            externalId: `vinted_${itemId}`,
            url,
            title: item.title || 'Vinted Item',
            price: parseFloat(item.price) || 0,
            currency: item.currency || 'USD',
            locationText: item.user?.city || item.location?.city,
            imageUrl: item.photos?.[0]?.url || item.photo?.url,
            sellerName: item.user?.login,
            description: item.description,
            status: item.status === 'active' ? 'active' : 
                   item.status === 'sold' ? 'sold' : 'unknown',
            raw: {
              url,
              itemId,
              apiData: item,
            },
            firstSeenAt: new Date(),
            lastSeenAt: new Date(),
          };
        }
      } catch (apiError: any) {
        // API failed, fall back to HTML parsing
        console.log(`Vinted API failed for ${itemId}, falling back to HTML parsing`);
      }

      // Fallback: HTML parsing
      const htmlResponse = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
      });

      if (htmlResponse.status === 200 && htmlResponse.data) {
        const html = htmlResponse.data;
        
        // Extract data from HTML
        let title = 'Vinted Item';
        let price = 0;
        let currency = 'USD';
        let locationText: string | undefined;
        let imageUrl: string | undefined;

        // Title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                          html.match(/property="og:title"[^>]*content="([^"]+)"/i);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }

        // Price - Vinted often shows price in format like "£25.00" or "€30"
        const priceMatch = html.match(/(?:£|€|\$|USD|EUR|GBP)\s*(\d+(?:\.\d{2})?)/i) ||
                          html.match(/price["\s:]+(\d+(?:\.\d{2})?)/i);
        if (priceMatch) {
          price = parseFloat(priceMatch[1]);
          // Try to detect currency
          if (html.includes('£') || html.includes('GBP')) currency = 'GBP';
          else if (html.includes('€') || html.includes('EUR')) currency = 'EUR';
          else if (html.includes('$') || html.includes('USD')) currency = 'USD';
        }

        // Location
        const locationMatch = html.match(/location["\s:]+([^<"]+)/i);
        if (locationMatch) {
          locationText = locationMatch[1].trim();
        }

        // Image
        const imageMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i);
        if (imageMatch) {
          imageUrl = imageMatch[1];
        }

        return {
          marketplace: 'vinted',
          externalId: `vinted_${itemId}`,
          url,
          title,
          price,
          currency,
          locationText,
          imageUrl,
          status: htmlResponse.status === 200 ? 'active' : 'unknown',
          raw: {
            url,
            itemId,
            httpStatus: htmlResponse.status,
            extracted: {
              title: title !== 'Vinted Item',
              price: price > 0,
              location: !!locationText,
              image: !!imageUrl,
            },
          },
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        };
      }

      // If we get here, hydration failed
      return {
        marketplace: 'vinted',
        externalId: `vinted_${itemId}`,
        url,
        title: 'Vinted Item',
        price: 0,
        currency: 'USD',
        status: 'unknown',
        raw: {
          url,
          itemId,
          error: 'Hydration failed - unable to parse',
        },
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      };
    } catch (error: any) {
      // Store URL for later retry
      return {
        marketplace: 'vinted',
        externalId: `vinted_${itemId || Date.now()}`,
        url,
        title: 'Vinted Item',
        price: 0,
        currency: 'USD',
        status: 'unknown',
        raw: {
          url,
          error: error.message || 'Hydration failed',
          itemId: itemId || null,
        },
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      };
    }
  }
}
