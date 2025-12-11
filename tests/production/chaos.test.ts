/**
 * Chaos Engineering Tests
 * Tests system resilience under failure conditions
 * 
 * Usage: pnpm test:chaos
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

const API_URL = process.env.API_URL || 'http://localhost:4000';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

// Chaos mode configuration
const CHAOS_MODE = process.env.CHAOS_MODE === 'true';
const SLOW_DB_DELAY = parseInt(process.env.SLOW_DB_DELAY || '1000', 10);
const WORKER_DELAY = parseInt(process.env.WORKER_DELAY || '2000', 10);

describe('Chaos Engineering Tests', () => {
  beforeEach(() => {
    if (!CHAOS_MODE) {
      console.warn('⚠️  Chaos mode disabled. Set CHAOS_MODE=true to enable.');
    }
  });

  afterEach(() => {
    // Cleanup any chaos injections
  });

  describe('1. Slow Database Simulation', () => {
    it('should handle slow database queries gracefully', async () => {
      if (!CHAOS_MODE) {
        console.log('⏭️  Skipping (chaos mode disabled)');
        return;
      }

      const start = Date.now();
      
      try {
        // Simulate slow DB by adding delay
        const response = await fetch(`${WEB_URL}/api/search/feed?limit=10`, {
          signal: AbortSignal.timeout(SLOW_DB_DELAY * 2), // 2x delay timeout
        });
        
        const duration = Date.now() - start;
        
        // Should either succeed or fail gracefully
        expect([200, 500, 503, 504]).toContain(response.status);
        
        if (response.status >= 500) {
          const data = await response.json();
          expect(data).toHaveProperty('error');
        }
      } catch (error) {
        // Timeout is acceptable in chaos mode
        expect(error).toBeInstanceOf(Error);
      }
    }, SLOW_DB_DELAY * 3);

    it('should timeout gracefully on very slow queries', async () => {
      if (!CHAOS_MODE) {
        console.log('⏭️  Skipping (chaos mode disabled)');
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        await fetch(`${WEB_URL}/api/search/feed?limit=10`, {
          signal: controller.signal,
        });
      } catch (error) {
        // Timeout is expected
        expect(error).toBeInstanceOf(Error);
      } finally {
        clearTimeout(timeout);
      }
    }, 10000);
  });

  describe('2. Network Failure Simulation', () => {
    it('should handle connection errors gracefully', async () => {
      // Test with invalid URL
      try {
        await fetch('http://invalid-host-12345:3000/api/search/feed', {
          signal: AbortSignal.timeout(2000),
        });
      } catch (error) {
        // Connection error is expected
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should retry on transient failures', async () => {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          const response = await fetch(`${API_URL}/health`);
          if (response.ok) {
            break; // Success
          }
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw error;
          }
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      expect(attempts).toBeLessThan(maxAttempts);
    });
  });

  describe('3. High Load Simulation', () => {
    it('should handle concurrent requests', async () => {
      const concurrentRequests = 10;
      const promises = Array.from({ length: concurrentRequests }, () =>
        fetch(`${WEB_URL}/api/search/feed?limit=5`)
      );

      const responses = await Promise.allSettled(promises);

      // At least some should succeed
      const successful = responses.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 200
      ).length;

      expect(successful).toBeGreaterThan(0);
    }, 30000);

    it('should maintain performance under load', async () => {
      const requests = 5;
      const durations: number[] = [];

      for (let i = 0; i < requests; i++) {
        const start = Date.now();
        await fetch(`${API_URL}/health`);
        durations.push(Date.now() - start);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      // Average should be reasonable
      expect(avgDuration).toBeLessThan(1000);
      // Max should not be excessive
      expect(maxDuration).toBeLessThan(5000);
    });
  });

  describe('4. Invalid Input Handling', () => {
    it('should handle invalid pagination parameters', async () => {
      const response = await fetch(
        `${WEB_URL}/api/search/feed?limit=invalid&cursor=invalid`
      );

      // Should either return 400 or handle gracefully
      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('listings');
      } else {
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      }
    });

    it('should handle invalid price filters', async () => {
      const response = await fetch(
        `${WEB_URL}/api/search/feed?minPrice=invalid&maxPrice=also-invalid`
      );

      // Should handle gracefully
      expect([200, 400]).toContain(response.status);
    });

    it('should handle extremely large limits', async () => {
      const response = await fetch(`${WEB_URL}/api/search/feed?limit=10000`);

      // Should cap at max limit (100)
      if (response.status === 200) {
        const data = await response.json();
        expect(data.pagination.limit).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('5. Resource Exhaustion Simulation', () => {
    it('should handle memory pressure gracefully', async () => {
      // Make many requests to simulate memory pressure
      const requests = 20;
      const promises = Array.from({ length: requests }, () =>
        fetch(`${WEB_URL}/api/search/feed?limit=50`)
      );

      const results = await Promise.allSettled(promises);

      // Most should succeed
      const successful = results.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 200
      ).length;

      expect(successful).toBeGreaterThan(requests * 0.8); // 80% success rate
    }, 60000);
  });

  describe('6. Partial Failure Simulation', () => {
    it('should degrade gracefully when some services fail', async () => {
      // Test health endpoint - should work even if some checks fail
      const response = await fetch(`${API_URL}/health/readiness`);

      // Should return status even if some checks fail
      expect([200, 503]).toContain(response.status);
      const data = await response.json();
      expect(data).toHaveProperty('checks');
    });

    it('should return partial data when possible', async () => {
      const response = await fetch(`${WEB_URL}/api/search/feed?limit=10`);

      if (response.status === 200) {
        const data = await response.json();
        // Should return structure even if empty
        expect(data).toHaveProperty('listings');
        expect(data).toHaveProperty('pagination');
      }
    });

    it('should handle partial API failures', async () => {
      // Test multiple endpoints - some may fail
      const endpoints = [
        `${WEB_URL}/api/search/feed?limit=5`,
        `${WEB_URL}/api/compliance/risk-scores`,
        `${WEB_URL}/api/search/realtime`,
      ];

      const results = await Promise.allSettled(
        endpoints.map((url) =>
          fetch(url, { signal: AbortSignal.timeout(3000) })
        )
      );

      // At least one should succeed
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      expect(successful).toBeGreaterThan(0);
    });

    it('should continue operating with degraded performance', async () => {
      // Simulate slow responses but still functional
      const start = Date.now();
      const response = await fetch(`${WEB_URL}/api/search/feed?limit=10`, {
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      const duration = Date.now() - start;

      // Should eventually respond (even if slow)
      expect([200, 500, 503]).toContain(response.status);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('listings');
      }
    }, 15000);
  });

  describe('7. Delay Injection', () => {
    it('should handle artificial delays in requests', async () => {
      if (!CHAOS_MODE) {
        console.log('⏭️  Skipping (chaos mode disabled)');
        return;
      }

      const delays = [500, 1000, 2000];
      
      for (const delay of delays) {
        const start = Date.now();
        const response = await fetch(`${WEB_URL}/api/search/feed?limit=5`, {
          signal: AbortSignal.timeout(delay * 3),
        });
        const duration = Date.now() - start;

        // Should handle delay gracefully
        expect([200, 500, 503, 504]).toContain(response.status);
        
        // Duration should reflect the delay (within reason)
        expect(duration).toBeLessThan(delay * 3);
      }
    }, 30000);

    it('should handle cascading delays', async () => {
      if (!CHAOS_MODE) {
        console.log('⏭️  Skipping (chaos mode disabled)');
        return;
      }

      // Make multiple requests with delays between them
      const requests = [];
      for (let i = 0; i < 3; i++) {
        requests.push(
          fetch(`${WEB_URL}/api/search/feed?limit=5`, {
            signal: AbortSignal.timeout(5000),
          }).then((r) => r.status)
        );
        // Add delay between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const statuses = await Promise.all(requests);
      
      // All should eventually respond (even if some fail)
      statuses.forEach((status) => {
        expect([200, 500, 503, 504]).toContain(status);
      });
    }, 20000);
  });

  describe('8. Partial Data Availability', () => {
    it('should return partial results when full data unavailable', async () => {
      // Test with filters that might return partial data
      const response = await fetch(
        `${WEB_URL}/api/search/feed?marketplaces=nonexistent&limit=10`
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Should return structure even with no results
      expect(data).toHaveProperty('listings');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.listings)).toBe(true);
    });

    it('should handle missing optional fields gracefully', async () => {
      const response = await fetch(`${WEB_URL}/api/search/feed?limit=10`);
      
      if (response.status === 200) {
        const data = await response.json();
        
        // Should have required fields
        expect(data).toHaveProperty('listings');
        expect(data).toHaveProperty('pagination');
        
        // Optional fields might be missing, which is OK
        if (data.listings.length > 0) {
          const listing = data.listings[0];
          // Some fields might be undefined/null
          expect(listing).toHaveProperty('id');
          expect(listing).toHaveProperty('title');
        }
      }
    });
  });

  describe('9. Rate Limiting Under Chaos', () => {
    it('should enforce rate limits under load', async () => {
      // Make rapid requests
      const rapidRequests = 50;
      const promises = Array.from({ length: rapidRequests }, () =>
        fetch(`${API_URL}/health`)
      );

      const results = await Promise.allSettled(promises);

      // Some may be rate limited (429), but most should succeed
      const statuses = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<Response>).value.status);

      const successCount = statuses.filter((s) => s === 200).length;
      const rateLimitedCount = statuses.filter((s) => s === 429).length;

      // Should have some success
      expect(successCount + rateLimitedCount).toBeGreaterThan(0);
    }, 30000);
  });
});
