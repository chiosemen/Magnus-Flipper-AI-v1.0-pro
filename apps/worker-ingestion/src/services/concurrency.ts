/**
 * Concurrency control: 10 concurrent tasks per marketplace
 */

class ConcurrencyManager {
  private activeByMarketplace = new Map<string, number>();
  private readonly MAX_CONCURRENT = 10;

  /**
   * Check if we can start a new task for a marketplace
   */
  canStart(marketplace: string): boolean {
    const active = this.activeByMarketplace.get(marketplace) || 0;
    return active < this.MAX_CONCURRENT;
  }

  /**
   * Increment active count for a marketplace
   */
  start(marketplace: string): void {
    const current = this.activeByMarketplace.get(marketplace) || 0;
    this.activeByMarketplace.set(marketplace, current + 1);
  }

  /**
   * Decrement active count for a marketplace
   */
  finish(marketplace: string): void {
    const current = this.activeByMarketplace.get(marketplace) || 0;
    if (current > 0) {
      this.activeByMarketplace.set(marketplace, current - 1);
    }
  }

  /**
   * Get current active count for a marketplace
   */
  getActive(marketplace: string): number {
    return this.activeByMarketplace.get(marketplace) || 0;
  }

  /**
   * Get all active counts
   */
  getAllActive(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [marketplace, count] of this.activeByMarketplace.entries()) {
      result[marketplace] = count;
    }
    return result;
  }
}

export const concurrencyManager = new ConcurrencyManager();
