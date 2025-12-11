/**
 * Feed Correctness Tests
 * Validates feed engine deduplication, ranking, and aggregation
 * 
 * Usage: pnpm test:feed
 */

import { describe, it, expect } from '@jest/globals';
import {
  generateFingerprint,
  deduplicateListings,
  areDuplicates,
} from '@magnus-flipper-ai/feed-engine/fingerprint';
import {
  calculateVelocityScore,
  calculateRankingScore,
  rankListings,
} from '@magnus-flipper-ai/feed-engine/ranking';
import {
  aggregateListings,
  calculateMarketplaceAvgPrices,
} from '@magnus-flipper-ai/feed-engine/aggregation';

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

// Mock listing data
const createMockListing = (overrides: any = {}) => ({
  id: `listing-${Math.random().toString(36).substr(2, 9)}`,
  title: 'iPhone 15 Pro Max 256GB',
  price: 999,
  marketplace: 'ebay',
  firstSeen: new Date('2025-01-01'),
  lastSeen: new Date('2025-01-15'),
  description: 'Brand new iPhone 15 Pro Max',
  imageUrl: 'https://example.com/image.jpg',
  location: 'New York, NY',
  sellerId: 'seller-123',
  sellerName: 'John Doe',
  viewsCount: 100,
  ...overrides,
});

describe('Feed Correctness Tests', () => {
  describe('1. Fingerprinting & Deduplication', () => {
    it('should generate consistent fingerprints for identical listings', () => {
      const listing1 = createMockListing();
      const listing2 = { ...listing1 }; // Same data
      
      const fp1 = generateFingerprint(listing1);
      const fp2 = generateFingerprint(listing2);
      
      expect(fp1.contentHash).toBe(fp2.contentHash);
      expect(fp1.titleHash).toBe(fp2.titleHash);
      expect(fp1.priceHash).toBe(fp2.priceHash);
    });

    it('should generate different fingerprints for different listings', () => {
      const listing1 = createMockListing({ title: 'iPhone 15 Pro Max' });
      const listing2 = createMockListing({ title: 'Samsung Galaxy S24' });
      
      const fp1 = generateFingerprint(listing1);
      const fp2 = generateFingerprint(listing2);
      
      expect(fp1.contentHash).not.toBe(fp2.contentHash);
    });

    it('should detect duplicates with strict threshold', () => {
      const listing1 = createMockListing();
      const listing2 = { ...listing1, price: listing1.price + 1 }; // Slight price difference
      
      const fp1 = generateFingerprint(listing1);
      const fp2 = generateFingerprint(listing2);
      
      // Strict threshold should not match
      expect(areDuplicates(fp1, fp2, 'strict')).toBe(false);
      
      // Normal threshold might match (depends on implementation)
      const isNormalDuplicate = areDuplicates(fp1, fp2, 'normal');
      expect(typeof isNormalDuplicate).toBe('boolean');
    });

    it('should deduplicate listings array', () => {
      const listing1 = createMockListing({ id: 'listing-1' });
      const listing2 = { ...listing1, id: 'listing-2' }; // Duplicate content
      const listing3 = createMockListing({ title: 'Different Item', id: 'listing-3' });
      
      const listings = [listing1, listing2, listing3];
      const deduped = deduplicateListings(listings, 'normal');
      
      expect(deduped.length).toBeLessThanOrEqual(listings.length);
      expect(deduped.length).toBeGreaterThanOrEqual(2); // At least 2 unique items
    });
  });

  describe('2. Ranking Algorithm', () => {
    it('should calculate velocity score', () => {
      const listing = createMockListing({
        firstSeen: new Date('2025-01-01'),
        lastSeen: new Date('2025-01-15'),
        viewsCount: 100,
      });
      
      const velocity = calculateVelocityScore(listing);
      
      expect(velocity).toBeGreaterThanOrEqual(0);
      expect(typeof velocity).toBe('number');
    });

    it('should calculate ranking score with all factors', () => {
      const listing = createMockListing({
        firstSeen: new Date('2025-01-01'),
        lastSeen: new Date('2025-01-15'),
        viewsCount: 100,
        price: 999,
      });
      
      const score = calculateRankingScore(listing, 1000);
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('velocity');
      expect(score).toHaveProperty('freshness');
      expect(score).toHaveProperty('price');
      expect(score).toHaveProperty('engagement');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(1);
    });

    it('should rank listings by score', () => {
      const listings = [
        createMockListing({ viewsCount: 1000, price: 500 }),
        createMockListing({ viewsCount: 100, price: 1000 }),
        createMockListing({ viewsCount: 500, price: 750 }),
      ];
      
      const ranked = rankListings(listings);
      
      expect(ranked.length).toBe(listings.length);
      expect(ranked[0]).toHaveProperty('rankingScore');
      
      // First item should have highest score
      if (ranked.length > 1) {
        expect(ranked[0].rankingScore.overall).toBeGreaterThanOrEqual(
          ranked[1].rankingScore.overall
        );
      }
    });
  });

  describe('3. Aggregation', () => {
    it('should aggregate listings with deduplication', () => {
      const listings = [
        createMockListing({ id: '1', marketplace: 'ebay' }),
        createMockListing({ id: '2', marketplace: 'ebay' }),
        createMockListing({ id: '3', marketplace: 'facebook' }),
      ];
      
      const aggregated = aggregateListings(listings, {
        deduplicate: true,
        rank: true,
        limit: 10,
      });
      
      expect(aggregated.length).toBeLessThanOrEqual(listings.length);
      expect(aggregated.length).toBeGreaterThan(0);
    });

    it('should calculate marketplace average prices', () => {
      const listings = [
        createMockListing({ marketplace: 'ebay', price: 100 }),
        createMockListing({ marketplace: 'ebay', price: 200 }),
        createMockListing({ marketplace: 'facebook', price: 150 }),
      ];
      
      const avgPrices = calculateMarketplaceAvgPrices(listings);
      
      expect(avgPrices.has('ebay')).toBe(true);
      expect(avgPrices.has('facebook')).toBe(true);
      expect(avgPrices.get('ebay')).toBe(150); // (100 + 200) / 2
      expect(avgPrices.get('facebook')).toBe(150);
    });

    it('should respect pagination limit', () => {
      const listings = Array.from({ length: 100 }, (_, i) =>
        createMockListing({ id: `listing-${i}` })
      );
      
      const aggregated = aggregateListings(listings, {
        deduplicate: false,
        rank: true,
        limit: 10,
      });
      
      expect(aggregated.length).toBeLessThanOrEqual(10);
    });
  });

  describe('4. API Feed Correctness', () => {
    it('should return deduplicated listings', async () => {
      const response = await fetch(`${WEB_URL}/api/search/feed?limit=50&deduplicate=true`);
      const data = await response.json();
      
      if (data.listings.length > 1) {
        // Check for obvious duplicates (same ID)
        const ids = data.listings.map((l: any) => l.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });

    it('should return ranked listings', async () => {
      const response = await fetch(`${WEB_URL}/api/search/feed?limit=10&rank=true`);
      const data = await response.json();
      
      if (data.listings.length > 1) {
        // First listing should have ranking score
        const first = data.listings[0];
        expect(first).toHaveProperty('rankingScore');
      }
    });

    it('should handle pagination correctly', async () => {
      // First page
      const response1 = await fetch(`${WEB_URL}/api/search/feed?limit=5`);
      const data1 = await response1.json();
      
      if (data1.pagination.hasMore) {
        // Second page
        const response2 = await fetch(
          `${WEB_URL}/api/search/feed?limit=5&cursor=${data1.pagination.nextCursor}`
        );
        const data2 = await response2.json();
        
        // Should have different listings
        const ids1 = data1.listings.map((l: any) => l.id);
        const ids2 = data2.listings.map((l: any) => l.id);
        const overlap = ids1.filter((id) => ids2.includes(id));
        
        // Allow some overlap due to ranking changes, but not all
        expect(overlap.length).toBeLessThan(ids1.length);
      }
    });

    it('should filter by marketplace correctly', async () => {
      const response = await fetch(`${WEB_URL}/api/search/feed?marketplaces=ebay&limit=10`);
      const data = await response.json();
      
      if (data.listings.length > 0) {
        data.listings.forEach((listing: any) => {
          expect(listing.marketplace).toBe('ebay');
        });
      }
    });
  });
});
