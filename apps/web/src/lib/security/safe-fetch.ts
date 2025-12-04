/**
 * Safe Fetch Utility
 * Protects against SSRF (Server-Side Request Forgery) attacks
 */

import { logWarn, logError } from '@/lib/observability/logger';

// Blocked IP ranges (internal/private networks)
const BLOCKED_IP_RANGES = [
  // Private IPv4 ranges
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./,
  /^0\.0\.0\.0/,
  
  // Localhost variants
  /^localhost$/i,
  /^::1$/,
  /^0:0:0:0:0:0:0:1$/,
  
  // Link-local
  /^fe80:/i,
  
  // Private IPv6 ranges
  /^fc00:/i,
  /^fd00:/i,
];

// Allowed domains (whitelist approach for critical operations)
const ALLOWED_DOMAINS = [
  'supabase.co',
  'stripe.com',
  'api.stripe.com',
  'hooks.stripe.com',
  'js.stripe.com',
];

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Check if an IP address is in a blocked range
 */
function isBlockedIP(ip: string): boolean {
  return BLOCKED_IP_RANGES.some((pattern) => pattern.test(ip));
}

/**
 * Check if a URL is safe to fetch
 */
function isSafeURL(url: string): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(url);
    
    // Only allow http/https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: 'Invalid protocol' };
    }
    
    // In production, block localhost
    if (isProduction) {
      const hostname = parsed.hostname.toLowerCase();
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return { safe: false, reason: 'Localhost blocked in production' };
      }
    }
    
    // Check for blocked IP patterns in hostname
    if (isBlockedIP(parsed.hostname)) {
      return { safe: false, reason: 'Blocked IP range' };
    }
    
    // Check for suspicious patterns
    if (parsed.hostname.includes('..') || parsed.hostname.startsWith('.')) {
      return { safe: false, reason: 'Suspicious hostname pattern' };
    }
    
    return { safe: true };
  } catch (error) {
    return { safe: false, reason: 'Invalid URL format' };
  }
}

/**
 * Resolve hostname to IP (basic check)
 * In a real implementation, you'd want to do actual DNS resolution
 */
async function resolveHostname(hostname: string): Promise<string | null> {
  // This is a placeholder - in production, you'd want actual DNS resolution
  // For now, we rely on URL parsing and pattern matching
  return hostname;
}

/**
 * Safe fetch wrapper that blocks SSRF attempts
 */
export async function safeFetch(
  url: string | URL,
  options?: RequestInit,
  allowedDomains?: string[]
): Promise<Response> {
  const urlString = typeof url === 'string' ? url : url.toString();
  
  // Check if URL is safe
  const safetyCheck = isSafeURL(urlString);
  if (!safetyCheck.safe) {
    logWarn('Blocked unsafe fetch attempt', {
      url: urlString,
      reason: safetyCheck.reason,
    });
    throw new Error(`Unsafe URL: ${safetyCheck.reason}`);
  }
  
  const parsed = new URL(urlString);
  const hostname = parsed.hostname.toLowerCase();
  
  // If allowedDomains is provided, enforce whitelist
  if (allowedDomains && allowedDomains.length > 0) {
    const isAllowed = allowedDomains.some((domain) => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
    
    if (!isAllowed) {
      logWarn('Blocked fetch to non-whitelisted domain', {
        url: urlString,
        hostname,
        allowedDomains,
      });
      throw new Error(`Domain not in whitelist: ${hostname}`);
    }
  }
  
  // Additional check: resolve and verify IP (if possible)
  try {
    const resolvedIP = await resolveHostname(hostname);
    if (resolvedIP && isBlockedIP(resolvedIP)) {
      logWarn('Blocked fetch to internal IP', {
        url: urlString,
        resolvedIP,
      });
      throw new Error(`Resolved to blocked IP: ${resolvedIP}`);
    }
  } catch (error) {
    // If resolution fails, log but don't block (might be network issue)
    logWarn('Could not resolve hostname', {
      url: urlString,
      hostname,
      error: error instanceof Error ? error.message : String(error),
    });
  }
  
  // Perform the fetch
  try {
    const response = await fetch(urlString, options);
    return response;
  } catch (error) {
    logError('Safe fetch failed', {
      url: urlString,
      error: error instanceof Error ? error : String(error),
    });
    throw error;
  }
}

/**
 * Safe fetch for external APIs (with domain whitelist)
 */
export async function safeExternalFetch(
  url: string | URL,
  options?: RequestInit
): Promise<Response> {
  return safeFetch(url, options, ALLOWED_DOMAINS);
}

