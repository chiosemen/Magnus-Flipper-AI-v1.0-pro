/**
 * Image Resolver Utility - PRODUCTION HARDENED
 *
 * Standardizes image handling across the app to prevent broken images:
 * - Converts protocol-relative URLs (//image/path.png) to absolute URLs
 * - Handles empty/null/malformed URLs with deterministic fallbacks
 * - Validates URLs before passing to next/image
 * - Provides strict TypeScript types to prevent ad-hoc image handling
 *
 * @rule ALL <Image> components must use resolveImage() - no direct src assignment
 */

const DEFAULT_FALLBACK = "/assets/placeholder-image.png";
const MAX_URL_LENGTH = 2048; // Reasonable URL length limit

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
  return DEFAULT_FALLBACK;
}

/**
 * Validate URL format and length
 */
function isUrlMalformed(url: string): boolean {
  // Check length
  if (url.length > MAX_URL_LENGTH) {
    console.warn(`[ImageResolver] URL exceeds max length (${url.length}): ${url.slice(0, 100)}...`);
    return true;
  }

  // Check for common malformations
  if (url.includes(" ")) {
    console.warn(`[ImageResolver] URL contains spaces: ${url}`);
    return true;
  }

  // Check for invalid protocols
  const invalidProtocols = ["javascript:", "data:text", "file:", "ftp:"];
  if (invalidProtocols.some((proto) => url.toLowerCase().startsWith(proto))) {
    console.warn(`[ImageResolver] Invalid protocol detected: ${url}`);
    return true;
  }

  return false;
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

/**
 * CANONICAL IMAGE RESOLVER
 *
 * This is the single source of truth for image URL resolution.
 * Use this for ALL image rendering to ensure consistent behavior.
 *
 * Handles:
 * - null/undefined/empty strings → fallback
 * - Protocol-relative URLs (//cdn.com/image.jpg) → https://cdn.com/image.jpg
 * - Malformed URLs → fallback with warning
 * - Valid URLs → normalized absolute URL
 *
 * @param src - Image source (may be null, empty, protocol-relative, or absolute)
 * @param options - Optional configuration
 * @returns Always returns a valid URL (never null)
 *
 * @example
 * ```tsx
 * import { resolveImage } from "@/lib/utils/imageResolver";
 *
 * <Image src={resolveImage(listing.imageUrl)} alt="..." fill />
 * ```
 */
export function resolveImage(
  src: string | null | undefined,
  options?: {
    fallback?: string;
    onError?: (reason: string) => void;
  }
): string {
  const fallback = options?.fallback || DEFAULT_FALLBACK;

  // Handle null/undefined/empty
  if (!src || src.trim() === "") {
    options?.onError?.("Image URL is null/undefined/empty");
    return fallback;
  }

  const trimmed = src.trim();

  // Check for malformed URLs
  if (isUrlMalformed(trimmed)) {
    options?.onError?.(`Malformed URL: ${trimmed}`);
    return fallback;
  }

  // Resolve the URL
  const resolved = resolveImageUrl(trimmed);

  // Validate the resolved URL
  if (!resolved || !isValidImageUrl(resolved)) {
    options?.onError?.(`Invalid URL after resolution: ${trimmed} → ${resolved}`);
    return fallback;
  }

  return resolved;
}

/**
 * Batch resolve multiple image URLs
 *
 * Useful for gallery/carousel components where you need to resolve many images at once.
 */
export function resolveImages(
  srcs: (string | null | undefined)[],
  options?: { fallback?: string }
): string[] {
  return srcs.map((src) => resolveImage(src, options));
}

