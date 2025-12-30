/**
 * In-memory Redis stub for unit tests
 * Provides the same interface as @upstash/redis but stores data in memory
 */
export class InMemoryRedis {
  private store = new Map<string, { value: any; expiresAt?: number }>();

  async get<T = any>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  async set(key: string, value: any, options?: { ex?: number; nx?: boolean }): Promise<string> {
    if (options?.nx && this.store.has(key)) {
      return null as any; // NX means "set only if not exists"
    }
    
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.store.keys()).filter((key) => regex.test(key));
  }

  async flushall(): Promise<string> {
    this.store.clear();
    return 'OK';
  }

  // Helper for test cleanup
  clear(): void {
    this.store.clear();
  }
}

