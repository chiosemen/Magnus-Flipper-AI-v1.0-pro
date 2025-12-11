/**
 * Fingerprint Helper
 * Utilities for applying fingerprints to HTTP requests
 */

import { RequestFingerprint } from '@magnus-flipper-ai/compliance-shield';
import { MarketplaceProfile, MarketplaceId } from '@magnus-flipper-ai/marketplace-config';
import { getFingerprintWithMutation } from '@magnus-flipper-ai/compliance-shield/fingerprintManager';

/**
 * Get fingerprint for a marketplace and apply to axios config
 */
export function getFingerprintHeaders(
  marketplace: MarketplaceId,
  profile: MarketplaceProfile
): Record<string, string> {
  const fingerprint = getFingerprintWithMutation(marketplace, profile);
  
  return {
    'User-Agent': fingerprint.userAgent,
    'Accept-Language': fingerprint.acceptLanguage,
    'Accept-Encoding': fingerprint.acceptEncoding,
    'Accept': fingerprint.headers.Accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    ...fingerprint.headers,
  };
}

/**
 * Get fingerprint for use in custom HTTP clients
 */
export function getFingerprint(
  marketplace: MarketplaceId,
  profile: MarketplaceProfile
): RequestFingerprint {
  return getFingerprintWithMutation(marketplace, profile);
}
