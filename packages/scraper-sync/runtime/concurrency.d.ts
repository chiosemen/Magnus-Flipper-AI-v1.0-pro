/**
 * Concurrency Controller
 * Uses p-queue to enforce hard concurrency limits per marketplace
 */
import PQueue from 'p-queue';
/**
 * Get or create a queue for a marketplace
 * Each marketplace has its own isolated queue with a hard limit of 10 concurrent tasks
 */
export declare function getMarketplaceQueue(marketplace: string): PQueue;
//# sourceMappingURL=concurrency.d.ts.map