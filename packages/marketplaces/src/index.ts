export * from './types';
export * from './facebook.adapter';
export * from './vinted.adapter';

import { FacebookAdapter } from './facebook.adapter';
import { VintedAdapter } from './vinted.adapter';
import type { MarketplaceAdapter } from './types';

/**
 * Get adapter for a marketplace
 */
export function getAdapter(marketplace: 'facebook' | 'vinted'): MarketplaceAdapter {
  switch (marketplace) {
    case 'facebook':
      return new FacebookAdapter();
    case 'vinted':
      return new VintedAdapter();
    default:
      throw new Error(`Unknown marketplace: ${marketplace}`);
  }
}

/**
 * Check if a marketplace is enabled via LIVE_MARKETPLACES env var
 */
export function isMarketplaceLive(marketplace: string): boolean {
  const liveMarketplaces = process.env.LIVE_MARKETPLACES || '';
  const enabled = liveMarketplaces
    .split(',')
    .map(m => m.trim().toLowerCase())
    .includes(marketplace.toLowerCase());
  
  return enabled;
}
