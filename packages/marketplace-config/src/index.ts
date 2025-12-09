export * from './types';
export * from './profiles';

import { MARKETPLACE_PROFILES } from './profiles';
import { MarketplaceProfile } from './types';

export function getMarketplaceProfile(id: string): MarketplaceProfile {
  const profile = MARKETPLACE_PROFILES[id];
  if (!profile) {
    throw new Error(`Unknown marketplace profile: ${id}`);
  }
  return profile;
}
