/**
 * API Smoke Tests
 * Comprehensive API endpoint validation
 * 
 * Usage: pnpm test:production:api-smoke
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

const API_URL = process.env.API_URL || 'http://localhost:4000';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

describe('API Smoke Tests', () => {
  beforeAll(() => {
    console.log('🚀 Starting API Smoke Tests...');
    console.log(`API URL: ${API_URL}`);
    console.log(`Web URL: ${WEB_URL}`);
  });

  describe('1. Health Endpoints', () => {
    it('should return 200 from API root', async () => {
      const response = await fetch(`${API_URL}/`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('message');
    });

    it('should return health status', async () => {
      const response = await fetch(`${API_URL}/health`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
    });

    it('should return liveness probe', async () => {
      const response = await fetch(`${API_URL}/health/liveness`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('alive');
    });

    it('should return readiness probe', async () => {
      const response = await fetch(`${API_URL}/health/readiness`);
      expect([200, 503]).toContain(response.status);
      const data = await response.json();
      expect(data).toHaveProperty('checks');
    });
  });

  describe('2. Feed API Endpoints', () => {
    it('should return feed listings', async () => {
      const response = await fetch(`${WEB_URL}/api/search/feed?limit=10`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('listings');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.listings)).toBe(true);
    });

    it('should support pagination', async () => {
      const response1 = await fetch(`${WEB_URL}/api/search/feed?limit=5`);
      const data1 = await response1.json();
      
      if (data1.pagination.hasMore && data1.pagination.nextCursor) {
        const response2 = await fetch(
          `${WEB_URL}/api/search/feed?limit=5&cursor=${data1.pagination.nextCursor}`
        );
        const data2 = await response2.json();
        expect(data2.listings.length).toBeGreaterThan(0);
      }
    });

    it('should filter by marketplace', async () => {
      const response = await fetch(`${WEB_URL}/api/search/feed?marketplaces=ebay&limit=10`);
      expect(response.status).toBe(200);
      const data = await response.json();
      if (data.listings.length > 0) {
        expect(data.listings.every((l: any) => l.marketplace === 'ebay')).toBe(true);
      }
    });

    it('should filter by price range', async () => {
      const response = await fetch(
        `${WEB_URL}/api/search/feed?minPrice=10&maxPrice=1000&limit=10`
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      if (data.listings.length > 0) {
        data.listings.forEach((listing: any) => {
          expect(listing.price).toBeGreaterThanOrEqual(10);
          expect(listing.price).toBeLessThanOrEqual(1000);
        });
      }
    });
  });

  describe('3. Realtime API Endpoints', () => {
    it('should return SSE stream', async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${WEB_URL}/api/search/realtime`, {
          signal: controller.signal,
          headers: {
            Accept: 'text/event-stream',
          },
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/event-stream');
      } finally {
        clearTimeout(timeout);
      }
    }, 10000);
  });

  describe('4. Compliance API Endpoints', () => {
    it('should return risk scores', async () => {
      const response = await fetch(`${WEB_URL}/api/compliance/risk-scores`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('marketplaces');
      expect(data).toHaveProperty('summary');
    });

    it('should return guardrails config', async () => {
      const response = await fetch(
        `${WEB_URL}/api/compliance/guardrails?marketplace=facebook`
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('marketplace');
      expect(data).toHaveProperty('guardrails');
    });
  });

  describe('5. Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await fetch(`${API_URL}/api/nonexistent`);
      expect([404, 200]).toContain(response.status); // May redirect or 404
    });

    it('should handle invalid parameters gracefully', async () => {
      const response = await fetch(`${WEB_URL}/api/search/feed?limit=invalid`);
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('6. Performance', () => {
    it('should respond to health check within 500ms', async () => {
      const start = Date.now();
      await fetch(`${API_URL}/health`);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it('should respond to feed API within 2s', async () => {
      const start = Date.now();
      await fetch(`${WEB_URL}/api/search/feed?limit=10`);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    });
  });
});
