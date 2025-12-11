/**
 * Fingerprint Manager
 * Manages request fingerprint rotation and signature mutation
 * CPU-efficient, tracks fingerprints per marketplace
 */
import { generateFingerprint } from './index';
// Per-marketplace fingerprint cache (max 5 per marketplace)
const fingerprintCache = new Map();
const MAX_CACHE_SIZE = 5;
const MAX_USE_COUNT = 10; // Rotate after 10 uses
const CACHE_TTL = 3600000; // 1 hour
/**
 * Get or generate a fingerprint with signature mutation
 * Rotates fingerprints based on use count and time
 */
export function getFingerprintWithMutation(marketplace, profile) {
    const cacheKey = marketplace;
    let cache = fingerprintCache.get(cacheKey) || [];
    // Clean expired entries
    const now = Date.now();
    cache = cache.filter((entry) => now - entry.lastUsed < CACHE_TTL);
    // Find unused or least-used fingerprint
    let selected = null;
    for (const entry of cache) {
        if (entry.useCount < MAX_USE_COUNT) {
            selected = entry;
            break;
        }
    }
    // If no suitable fingerprint, generate new one
    if (!selected || cache.length < MAX_CACHE_SIZE) {
        const baseFingerprint = generateFingerprint(profile);
        // Apply signature mutation (slight variations)
        const mutated = mutateFingerprint(baseFingerprint);
        selected = {
            fingerprint: mutated,
            lastUsed: now,
            useCount: 0,
        };
        cache.push(selected);
        // Keep cache size manageable
        if (cache.length > MAX_CACHE_SIZE) {
            // Remove oldest or most-used
            cache.sort((a, b) => {
                if (a.useCount !== b.useCount)
                    return a.useCount - b.useCount;
                return a.lastUsed - b.lastUsed;
            });
            cache.shift();
        }
    }
    // Update usage
    selected.useCount++;
    selected.lastUsed = now;
    fingerprintCache.set(cacheKey, cache);
    return selected.fingerprint;
}
/**
 * Mutate fingerprint signature to avoid detection
 * Slight variations in headers, viewport, etc.
 */
function mutateFingerprint(base) {
    const mutated = { ...base };
    // Mutate viewport slightly (±10px)
    const viewportJitter = {
        width: base.viewport.width + Math.floor((Math.random() * 20 - 10)),
        height: base.viewport.height + Math.floor((Math.random() * 20 - 10)),
    };
    mutated.viewport = {
        width: Math.max(800, Math.min(3840, viewportJitter.width)),
        height: Math.max(600, Math.min(2160, viewportJitter.height)),
    };
    // Mutate headers (add/remove optional headers)
    mutated.headers = { ...base.headers };
    // Randomly add/remove optional headers
    if (Math.random() > 0.5) {
        mutated.headers['DNT'] = '1';
    }
    else {
        delete mutated.headers['DNT'];
    }
    // Vary Accept-Encoding slightly
    const encodings = ['gzip, deflate, br', 'gzip, deflate', 'gzip'];
    mutated.acceptEncoding = encodings[Math.floor(Math.random() * encodings.length)];
    mutated.headers['Accept-Encoding'] = mutated.acceptEncoding;
    // Vary Cache-Control
    const cacheControls = ['max-age=0', 'no-cache', 'max-age=3600'];
    mutated.headers['Cache-Control'] = cacheControls[Math.floor(Math.random() * cacheControls.length)];
    return mutated;
}
/**
 * Clear fingerprint cache for a marketplace (useful for testing)
 */
export function clearFingerprintCache(marketplace) {
    if (marketplace) {
        fingerprintCache.delete(marketplace);
    }
    else {
        fingerprintCache.clear();
    }
}
/**
 * Get fingerprint statistics (for monitoring)
 */
export function getFingerprintStats() {
    const stats = {};
    for (const [marketplace, cache] of fingerprintCache.entries()) {
        const avgUseCount = cache.reduce((sum, e) => sum + e.useCount, 0) / cache.length;
        stats[marketplace] = {
            count: cache.length,
            avgUseCount: avgUseCount || 0,
        };
    }
    return stats;
}
//# sourceMappingURL=fingerprintManager.js.map