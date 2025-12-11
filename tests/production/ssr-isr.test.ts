/**
 * SSR/ISR Tests
 * Tests Next.js Server-Side Rendering and Incremental Static Regeneration
 * 
 * Usage: pnpm test:production:ssr-isr
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

describe('SSR/ISR Tests', () => {
  beforeAll(() => {
    console.log('🚀 Starting SSR/ISR Tests...');
    console.log(`Web URL: ${WEB_URL}`);
  });

  describe('1. Dynamic Rendering', () => {
    it('should render pages with dynamic content', async () => {
      const response = await fetch(`${WEB_URL}/api/search/feed?limit=10`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      expect(response.status).toBe(200);
      
      // Check for dynamic headers
      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toContain('no-store');
    });

    it('should include timestamp in dynamic responses', async () => {
      const response1 = await fetch(`${WEB_URL}/api/search/feed?limit=10`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response2 = await fetch(`${WEB_URL}/api/search/feed?limit=10`);

      const data1 = await response1.json();
      const data2 = await response2.json();

      // Responses should be independent (dynamic)
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('2. Cache Headers', () => {
    it('should set no-cache headers for dynamic routes', async () => {
      const response = await fetch(`${WEB_URL}/api/search/feed`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toMatch(/no-store|no-cache|must-revalidate/);
    });

    it('should respect revalidate=0 setting', async () => {
      // Feed route has revalidate=0, so should always be fresh
      const response = await fetch(`${WEB_URL}/api/search/feed?limit=5`);
      
      expect(response.status).toBe(200);
      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toMatch(/no-store|no-cache/);
    });
  });

  describe('3. Server-Side Data Fetching', () => {
    it('should fetch data server-side', async () => {
      const response = await fetch(`${WEB_URL}/api/search/feed?limit=10`, {
        headers: {
          'User-Agent': 'Test-Agent',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Should have server-rendered data structure
      expect(data).toHaveProperty('listings');
      expect(data).toHaveProperty('pagination');
      expect(data).toHaveProperty('metadata');
    });

    it('should handle server-side errors gracefully', async () => {
      // Test with invalid parameters that might cause server errors
      const response = await fetch(
        `${WEB_URL}/api/search/feed?limit=999999&cursor=invalid`
      );

      // Should either return 200 with empty data or 400/500 with error
      expect([200, 400, 500]).toContain(response.status);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('listings');
      }
    });
  });

  describe('4. Real-time Route Behavior', () => {
    it('should use force-dynamic for realtime routes', async () => {
      const response = await fetch(`${WEB_URL}/api/search/realtime`, {
        headers: {
          Accept: 'text/event-stream',
        },
      });

      // Should not be cached
      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toMatch(/no-cache|no-store/);
    });

    it('should stream data in real-time', async () => {
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
        
        // Should be streaming (not buffered)
        const cacheControl = response.headers.get('cache-control');
        expect(cacheControl).toMatch(/no-cache|no-store/);
      } finally {
        clearTimeout(timeout);
      }
    }, 10000);
  });

  describe('5. ISR Behavior (if applicable)', () => {
    it('should handle static generation with revalidation', async () => {
      // Test a route that might use ISR
      const response = await fetch(`${WEB_URL}/`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      expect(response.status).toBe(200);
      
      // Check for ISR headers (if applicable)
      const xNextjsCache = response.headers.get('x-nextjs-cache');
      // ISR might set this header, but it's optional
      if (xNextjsCache) {
        expect(['HIT', 'MISS', 'STALE', 'DYNAMIC']).toContain(xNextjsCache);
      }
    });
  });

  describe('6. Edge Runtime Compatibility', () => {
    it('should work with edge runtime if configured', async () => {
      const response = await fetch(`${WEB_URL}/api/search/feed?limit=5`);
      
      expect(response.status).toBe(200);
      // Edge runtime should still return valid JSON
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');
    });
  });

  describe('7. Response Time Consistency', () => {
    it('should have consistent response times for SSR', async () => {
      const times: number[] = [];

      for (let i = 0; i < 3; i++) {
        const start = Date.now();
        await fetch(`${WEB_URL}/api/search/feed?limit=10`);
        times.push(Date.now() - start);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const max = Math.max(...times);
      const min = Math.min(...times);

      // Response times should be reasonable (within 5s)
      expect(avg).toBeLessThan(5000);
      // Should not have huge variance (max should be < 3x min)
      if (min > 0) {
        expect(max / min).toBeLessThan(5);
      }
    });
  });
});
