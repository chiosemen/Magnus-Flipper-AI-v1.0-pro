import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import nock from 'nock';
import handler from '../../api/demo';
import { buildReqRes, getResponseData } from '../../test/helpers/http';
import { buildApifyResponse } from '../../test/helpers/apifyFixtures';
import { redis, ingestKey, searchKey } from '../../lib/redis';

// Mock auth to allow demo mode
vi.mock('../../lib/auth', () => ({
  requireUserFromJWT: vi.fn().mockResolvedValue({ userId: 'test-user' }),
}));

// Mock usage metering
vi.mock('../../lib/usageMetering', () => ({
  checkUsageLimits: vi.fn().mockResolvedValue({ allowed: true, current: { runs: 0, itemsReturned: 0, refreshTicks: 0, seedIngests: 0, uniqueQueries: 0, billableRuns: 0 } }),
  logUsageEvent: vi.fn().mockResolvedValue(undefined),
}));

// Mock entitlements
vi.mock('../../lib/entitlements', () => ({
  getMarketAgentEntitlement: vi.fn().mockResolvedValue({
    enabled: true,
    status: 'active',
    graceUntil: null,
  }),
}));

describe('demo.integration', () => {
  beforeEach(() => {
    nock.cleanAll();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    nock.cleanAll();
  });

  it('should return cached results when cache hit', async () => {
    const { req, res } = buildReqRes({
      method: 'GET',
      query: {
        q: 'macbook pro',
        marketplace: 'gumtree',
        country: 'GB',
        demo: 'true',
      },
    });

    // Pre-populate cache
    const cachedItems = [
      {
        source: 'gumtree',
        title: 'MacBook Pro M1',
        priceText: '£850',
        url: 'https://example.com/item1',
        image: 'https://example.com/image1.jpg',
      },
    ];

    const createdAt = Math.floor(Date.now() / 1000) - 30; // 30 seconds ago
    await redis.set(searchKey('gumtree', 'GB', 'macbook_pro'), {
      items: cachedItems,
      createdAt,
      strategy: 'apify',
    }, { ex: 300 });

    await handler(req, res);

    const response = getResponseData(res);
    expect(response.statusCode).toBe(200);
    expect(response.body.meta.cached).toBe(true);
    expect(response.body.meta.cacheStatus).toBe('hit');
    expect(response.body.items.length).toBeGreaterThan(0);
  });

  it('should return stale results when lock is busy and browser ingest exists', async () => {
    const { req, res } = buildReqRes({
      method: 'GET',
      query: {
        q: 'iphone 13',
        marketplace: 'vinted',
        country: 'GB',
        demo: 'true',
      },
    });

    // Set lock
    await redis.set(`lock:search:vinted:GB:iphone_13`, '1', { ex: 20 });

    // Set browser ingest
    const ingestedItems = [
      {
        title: 'iPhone 13 Pro',
        priceText: '€650',
        url: 'https://example.com/item1',
        image: 'https://example.com/image1.jpg',
      },
    ];

    const ingestedAt = Math.floor(Date.now() / 1000) - 60;
    await redis.set(ingestKey('vinted', 'GB', 'iphone_13'), {
      items: ingestedItems,
      ingestedAt,
    }, { ex: 600 });

    await handler(req, res);

    const response = getResponseData(res);
    expect(response.statusCode).toBe(200);
    expect(response.body.meta.cacheStatus).toBe('lock-busy');
    expect(response.body.items.length).toBeGreaterThan(0);
  });

  it('should never return 500, returns 200 with error-soft on internal errors', async () => {
    // Mock Apify to fail
    nock('https://api.apify.com')
      .post(/.*/)
      .reply(500, { error: 'Internal server error' });

    const { req, res } = buildReqRes({
      method: 'GET',
      query: {
        q: 'test query',
        marketplace: 'gumtree',
        country: 'GB',
        demo: 'true',
      },
    });

    await handler(req, res);

    const response = getResponseData(res);
    expect(response.statusCode).toBe(200);
    expect(response.body.meta.cacheStatus).toBe('error-soft');
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it('should mock Apify calls and return fixture items', async () => {
    const apifyResponse = buildApifyResponse('gumtree', 3);

    nock('https://api.apify.com')
      .post(/.*\/run-sync-get-dataset-items/)
      .reply(200, apifyResponse);

    const { req, res } = buildReqRes({
      method: 'GET',
      query: {
        q: 'macbook',
        marketplace: 'gumtree',
        country: 'GB',
        demo: 'true',
      },
    });

    await handler(req, res);

    const response = getResponseData(res);
    expect(response.statusCode).toBe(200);
    expect(response.body.items.length).toBe(3);
    expect(response.body.items[0].source).toBe('gumtree');
  });

  it('should release lock even on error', async () => {
    // Set lock first
    const lockKey = `lock:search:gumtree:GB:test_query`;
    await redis.set(lockKey, '1', { ex: 20 });

    // Mock Apify to fail
    nock('https://api.apify.com')
      .post(/.*/)
      .reply(500, { error: 'Internal server error' });

    const { req, res } = buildReqRes({
      method: 'GET',
      query: {
        q: 'test query',
        marketplace: 'gumtree',
        country: 'GB',
        demo: 'true',
      },
    });

    await handler(req, res);

    // Lock should be released
    const lockExists = await redis.get(lockKey);
    expect(lockExists).toBeNull();
  });
});

