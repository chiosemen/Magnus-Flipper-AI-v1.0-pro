import crypto from "crypto";

/**
 * Generate deterministic hash from image URL
 * Normalizes Facebook CDN variants and removes tracking parameters
 */
export function hashImageUrl(url: string): string {
  return crypto
    .createHash("sha1")
    .update(
      url
        .replace(/\/v\/t\d+\//, "") // normalize FB CDN variants
        .replace(/\?.*$/, "")       // drop tracking parameters
    )
    .digest("hex");
}
