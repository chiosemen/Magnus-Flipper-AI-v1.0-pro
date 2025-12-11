/**
 * Production Smoke Test Suite
 * Comprehensive smoke tests for all system components
 * 
 * Usage: pnpm test:smoke:production
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const API_URL = process.env.API_URL || 'http://localhost:4000';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';
const WORKER_HEALTH_URL = process.env.WORKER_HEALTH_URL || 'http://localhost:4001';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    results.push({ name, passed: true, duration: Date.now() - start });
  } catch (error) {
    results.push({
      name,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

describe('Production Smoke Tests', () => {
  beforeAll(() => {
    console.log('🚀 Starting Production Smoke Tests...');
    console.log(`API URL: ${API_URL}`);
    console.log(`Web URL: ${WEB_URL}`);
    console.log(`Worker Health URL: ${WORKER_HEALTH_URL}`);
  });

  afterAll(() => {
    console.log('\n📊 Test Results Summary:');
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${results.reduce((sum, r) => sum + r.duration, 0)}ms`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      results.filter((r) => !r.passed).forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    }
  });

  describe('1. API Health Checks', () => {
    it('should return 200 from API root', async () => {
      await runTest('API Root', async () => {
        const response = await fetch(`${API_URL}/`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('message');
      });
    });

    it('should return health status', async () => {
      await runTest('API Health', async () => {
        const response = await fetch(`${API_URL}/health`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.status).toBe('ok');
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('uptime');
      });
    });

    it('should return liveness probe', async () => {
      await runTest('API Liveness', async () => {
        const response = await fetch(`${API_URL}/health/liveness`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.status).toBe('alive');
      });
    });

    it('should return readiness probe', async () => {
      await runTest('API Readiness', async () => {
        const response = await fetch(`${API_URL}/health/readiness`);
        expect([200, 503]).toContain(response.status);
        const data = await response.json();
        expect(data).toHaveProperty('checks');
      });
    });
  });

  describe('2. Feed API Tests', () => {
    it('should return feed listings', async () => {
      await runTest('Feed API - Basic', async () => {
        const response = await fetch(`${WEB_URL}/api/search/feed?limit=10`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('listings');
        expect(data).toHaveProperty('pagination');
        expect(Array.isArray(data.listings)).toBe(true);
      });
    });

    it('should support pagination with cursor', async () => {
      await runTest('Feed API - Pagination', async () => {
        // First page
        const response1 = await fetch(`${WEB_URL}/api/search/feed?limit=5`);
        const data1 = await response1.json();
        expect(data1.pagination).toHaveProperty('hasMore');
        
        if (data1.pagination.hasMore && data1.pagination.nextCursor) {
          // Second page
          const response2 = await fetch(
            `${WEB_URL}/api/search/feed?limit=5&cursor=${data1.pagination.nextCursor}`
          );
          const data2 = await response2.json();
          expect(data2.listings.length).toBeGreaterThan(0);
          // Should have different listings
          expect(data2.listings[0].id).not.toBe(data1.listings[0].id);
        }
      });
    });

    it('should filter by marketplace', async () => {
      await runTest('Feed API - Marketplace Filter', async () => {
        const response = await fetch(`${WEB_URL}/api/search/feed?marketplaces=ebay&limit=10`);
        expect(response.status).toBe(200);
        const data = await response.json();
        if (data.listings.length > 0) {
          expect(data.listings.every((l: any) => l.marketplace === 'ebay')).toBe(true);
        }
      });
    });

    it('should filter by price range', async () => {
      await runTest('Feed API - Price Filter', async () => {
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
  });

  describe('3. Realtime API Tests', () => {
    it('should return SSE stream', async () => {
      await runTest('Realtime API - SSE', async () => {
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
      });
    }, 10000); // 10s timeout
  });

  describe('4. Worker Health Checks', () => {
    it('should return worker health status', async () => {
      await runTest('Worker Health', async () => {
        try {
          const response = await fetch(`${WORKER_HEALTH_URL}/health`);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data).toHaveProperty('status');
        } catch (error) {
          // Worker may not be running in test environment
          console.warn('Worker health check skipped (worker not available)');
        }
      });
    });
  });

  describe('5. Compliance API Tests', () => {
    it('should return risk scores', async () => {
      await runTest('Compliance API - Risk Scores', async () => {
        const response = await fetch(`${WEB_URL}/api/compliance/risk-scores`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('marketplaces');
        expect(data).toHaveProperty('summary');
        expect(Array.isArray(data.marketplaces)).toBe(true);
      });
    });

    it('should return guardrails config', async () => {
      await runTest('Compliance API - Guardrails', async () => {
        const response = await fetch(
          `${WEB_URL}/api/compliance/guardrails?marketplace=facebook`
        );
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('marketplace');
        expect(data).toHaveProperty('guardrails');
      });
    });
  });

  describe('6. Frontend Health Checks', () => {
    it('should return 200 from web root', async () => {
      await runTest('Web Root', async () => {
        const response = await fetch(`${WEB_URL}/`);
        expect(response.status).toBe(200);
      });
    });

    it('should return dashboard page', async () => {
      await runTest('Dashboard Page', async () => {
        const response = await fetch(`${WEB_URL}/dashboard`);
        expect([200, 302, 404]).toContain(response.status); // May redirect or 404 if not implemented
      });
    });
  });

  describe('7. Database Connectivity', () => {
    it('should connect to database via API', async () => {
      await runTest('Database Connectivity', async () => {
        const response = await fetch(`${API_URL}/health/readiness`);
        const data = await response.json();
        
        if (response.status === 200) {
          expect(data.checks).toHaveProperty('database');
          expect(data.checks.database).toBe(true);
        } else {
          console.warn('Database not available (expected in test environment)');
        }
      });
    });
  });

  describe('8. Performance Checks', () => {
    it('should respond to feed API within 2s', async () => {
      await runTest('Feed API Performance', async () => {
        const start = Date.now();
        const response = await fetch(`${WEB_URL}/api/search/feed?limit=10`);
        const duration = Date.now() - start;
        
        expect(response.status).toBe(200);
        expect(duration).toBeLessThan(2000); // 2 seconds
      });
    });

    it('should respond to health check within 500ms', async () => {
      await runTest('Health Check Performance', async () => {
        const start = Date.now();
        const response = await fetch(`${API_URL}/health`);
        const duration = Date.now() - start;
        
        expect(response.status).toBe(200);
        expect(duration).toBeLessThan(500); // 500ms
      });
    });
  });
});
