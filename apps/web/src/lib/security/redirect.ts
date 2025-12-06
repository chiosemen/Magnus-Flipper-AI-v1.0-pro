/**
 * Safe Redirect Utility
 * Prevents open redirect vulnerabilities
 */

import { sanitizeUrl } from './sanitize';
import { logWarn } from '@/lib/observability/logger';

// Allowed redirect domains (whitelist)
const ALLOWED_REDIRECT_DOMAINS = [
  'magnusflipper.com',
  'flipperagents.com',
  'localhost',
  '127.0.0.1',
];

// Check if domain is in development
function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if a redirect URL is safe
 */
export function isSafeRedirect(url: string | null | undefined): {
  safe: boolean;
  sanitized?: string;
  reason?: string;
} {
  if (!url) {
    return { safe: false, reason: 'Empty URL' };
  }
  
  // Sanitize URL first
  const sanitized = sanitizeUrl(url);
  if (!sanitized) {
    return { safe: false, reason: 'Invalid URL format' };
  }
  
  try {
    const parsed = new URL(sanitized);
    const hostname = parsed.hostname.toLowerCase();
    
    // In development, allow localhost
    if (isDevelopment()) {
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return { safe: true, sanitized };
      }
    }
    
    // Check if domain is in whitelist
    const isAllowed = ALLOWED_REDIRECT_DOMAINS.some((domain) => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
    
    if (!isAllowed) {
      logWarn('Blocked unsafe redirect', {
        originalUrl: url,
        sanitized,
        hostname,
        allowedDomains: ALLOWED_REDIRECT_DOMAINS,
      });
      return { safe: false, reason: `Domain not allowed: ${hostname}` };
    }
    
    // Only allow http/https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: 'Invalid protocol' };
    }
    
    return { safe: true, sanitized };
  } catch (error) {
    return { safe: false, reason: 'URL parsing failed' };
  }
}

/**
 * Create a safe redirect URL
 * Returns null if redirect is unsafe
 */
export function createSafeRedirect(
  url: string | null | undefined,
  fallback: string = '/'
): string {
  const check = isSafeRedirect(url);
  
  if (check.safe && check.sanitized) {
    return check.sanitized;
  }
  
  // Return fallback if redirect is unsafe
  logWarn('Redirect blocked, using fallback', {
    originalUrl: url,
    reason: check.reason,
    fallback,
  });
  
  return fallback;
}

/**
 * Safe redirect for Next.js (returns URL object or null)
 */
export function safeNextRedirect(
  url: string | null | undefined
): string | null {
  const check = isSafeRedirect(url);
  
  if (check.safe && check.sanitized) {
    return check.sanitized;
  }
  
  return null;
}

