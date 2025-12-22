/**
 * Image Resolver Utility
 * 
 * Standardizes image handling across the app:
 * - Converts protocol-relative URLs (//image/path.png) to absolute URLs
 * - Handles fallback images
 * - Ensures all images use proper URLs for next/image
 */

/**
 * Resolve image URL to absolute URL
 * 
 * @param imageUrl - Image URL (may be protocol-relative, relative, or absolute)
 * @param baseUrl - Base URL for the app (defaults to NEXT_PUBLIC_APP_URL or localhost)
 * @returns Absolute URL suitable for next/image
 */
export function resolveImageUrl(
  imageUrl: string | null | undefined,
  baseUrl?: string
): string | null {
  if (!imageUrl) {
    return null;
  }

  // Already absolute URL (http:// or https://)
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Protocol-relative URL (//image/path.png) - convert to https://
  if (imageUrl.startsWith("//")) {
    return `https:${imageUrl}`;
  }

  // Relative URL starting with / - treat as public asset
  if (imageUrl.startsWith("/")) {
    const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${base}${imageUrl}`;
  }

  // Relative URL without / - assume it's a public asset
  if (!imageUrl.includes("://")) {
    const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${base}/${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  }

  // Fallback: return as-is (might be data: URL or other format)
  return imageUrl;
}

/**
 * Get fallback image URL
 */
export function getFallbackImageUrl(): string {
  return "/public/assets/placeholder.png";
}

/**
 * Check if image URL is valid for next/image
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  // Must be absolute URL (http/https) or data URL
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("/")
  );
}

/**
 * Sanitize image URL for next/image
 * 
 * @param imageUrl - Image URL to sanitize
 * @returns Sanitized URL or fallback
 */
export function sanitizeImageUrl(imageUrl: string | null | undefined): string {
  const resolved = resolveImageUrl(imageUrl);
  
  if (!resolved || !isValidImageUrl(resolved)) {
    return getFallbackImageUrl();
  }

  return resolved;
}

