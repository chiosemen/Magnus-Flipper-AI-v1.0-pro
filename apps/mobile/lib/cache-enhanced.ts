/**
 * Enhanced Cache Management
 * Improved cache strategies with size limits and invalidation
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CacheStats } from "@magnus-flipper-ai/core/types/mobile";

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxMemorySize: number; // bytes
  maxDiskSize: number; // bytes
  maxEntries: number;
  ttl: number; // milliseconds
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxMemorySize: 50 * 1024 * 1024, // 50MB
  maxDiskSize: 200 * 1024 * 1024, // 200MB
  maxEntries: 1000,
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  size: number; // bytes (estimated)
  accessCount: number;
  lastAccessed: number;
}

/**
 * Enhanced cache manager
 */
class EnhancedCacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  /**
   * Get cache entry
   */
  async get(key: string): Promise<any | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      // Check TTL
      if (Date.now() - memoryEntry.timestamp < this.config.ttl) {
        memoryEntry.accessCount++;
        memoryEntry.lastAccessed = Date.now();
        return memoryEntry.value;
      } else {
        // Expired, remove
        this.memoryCache.delete(key);
      }
    }

    // Check disk cache
    try {
      const diskKey = `cache_${key}`;
      const cached = await AsyncStorage.getItem(diskKey);
      if (cached) {
        const entry: CacheEntry = JSON.parse(cached);
        // Check TTL
        if (Date.now() - entry.timestamp < this.config.ttl) {
          // Promote to memory cache
          this.memoryCache.set(key, entry);
          entry.accessCount++;
          entry.lastAccessed = Date.now();
          return entry.value;
        } else {
          // Expired, remove
          await AsyncStorage.removeItem(diskKey);
        }
      }
    } catch (error) {
      console.error("Error reading from disk cache:", error);
    }

    return null;
  }

  /**
   * Set cache entry
   */
  async set(key: string, value: any, size?: number): Promise<void> {
    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      size: size || this.estimateSize(value),
      accessCount: 1,
      lastAccessed: Date.now(),
    };

    // Check memory cache size limit
    if (this.getMemoryCacheSize() + entry.size > this.config.maxMemorySize) {
      await this.evictMemoryCache();
    }

    // Add to memory cache
    this.memoryCache.set(key, entry);

    // Persist to disk cache (async, don't block)
    this.persistToDisk(key, entry).catch(console.error);
  }

  /**
   * Remove cache entry
   */
  async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.error("Error removing from disk cache:", error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith("cache_"));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error("Error clearing disk cache:", error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const memoryEntries = Array.from(this.memoryCache.values());
    const memorySize = memoryEntries.reduce((sum, entry) => sum + entry.size, 0);

    // Get disk cache stats
    let diskEntries = 0;
    let diskSize = 0;
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith("cache_"));
      diskEntries = cacheKeys.length;

      // Estimate disk size (AsyncStorage doesn't provide exact size)
      diskSize = diskEntries * 1024; // Rough estimate: 1KB per entry
    } catch (error) {
      console.error("Error getting disk cache stats:", error);
    }

    // Calculate hit rate (placeholder - would need actual tracking)
    const hitRate = 0.85; // Placeholder

    return {
      imageCache: {
        memoryEntries: memoryEntries.length,
        memorySize,
        diskEntries,
        diskSize,
        hitRate,
      },
      queryCache: {
        entries: 0, // Would need React Query cache stats
        size: 0,
        hitRate: 0.9,
        staleEntries: 0,
      },
      offlineStorage: {
        size: diskSize,
        entries: diskEntries,
        lastSync: new Date().toISOString(),
      },
    };
  }

  /**
   * Evict least recently used entries from memory cache
   */
  private async evictMemoryCache(): Promise<void> {
    const entries = Array.from(this.memoryCache.entries());
    // Sort by last accessed (LRU)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Remove oldest 20% of entries
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
  }

  /**
   * Get total memory cache size
   */
  private getMemoryCacheSize(): number {
    return Array.from(this.memoryCache.values()).reduce((sum, entry) => sum + entry.size, 0);
  }

  /**
   * Estimate size of value (rough approximation)
   */
  private estimateSize(value: any): number {
    const str = JSON.stringify(value);
    return new Blob([str]).size;
  }

  /**
   * Persist entry to disk
   */
  private async persistToDisk(key: string, entry: CacheEntry): Promise<void> {
    try {
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.error("Error persisting to disk cache:", error);
    }
  }
}

export const enhancedCacheManager = new EnhancedCacheManager();
