import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from '../../api/usage';
import { buildReqRes, getResponseData } from '../../test/helpers/http';
import { seedTestUser, cleanupTestUser } from '../../test/helpers/db';

// Mock auth
vi.mock('../../lib/auth', () => ({
  requireUserFromJWT: vi.fn().mockImplementation((authHeader: string) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Promise.resolve({ userId: null });
    }
    return Promise.resolve({ userId: 'test-user-usage' });
  }),
}));

// Mock entitlements
vi.mock('../../lib/entitlements', () => ({
  getMarketAgentEntitlement: vi.fn().mockResolvedValue({
    enabled: true,
    status: 'active',
    graceUntil: null,
    stripeCustomerId: 'cus_test',
    stripeSubscriptionId: 'sub_test',
    override: null,
  }),
}));

// Mock usage metering
vi.mock('../../lib/usageMetering', () => ({
  DEFAULT_LIMITS: { runsPerDay: 250, itemsPerDay: 20000 },
  checkUsageLimits: vi.fn().mockResolvedValue({
    allowed: true,
    current: {
      runs: 10,
      refreshTicks: 5,
      seedIngests: 2,
      itemsReturned: 500,
      uniqueQueries: 3,
      billableRuns: 8,
    },
  }),
}));

// Mock entitlement resolver
vi.mock('../../lib/entitlementResolver', () => ({
  resolveEntitlement: vi.fn().mockResolvedValue({ tier: 'pro' }),
}));

// Mock tier policy
vi.mock('../../lib/tierPolicy', () => ({
  getTierPolicy: vi.fn().mockReturnValue({
    maxScansPerMonth: 1000,
    maxSavedSearches: 10,
  }),
}));

describe('usage.integration', () => {
  const testUserId = 'test-user-usage';

  beforeEach(async () => {
    vi.clearAllMocks();
    await seedTestUser({
      userId: testUserId,
      email: 'test@example.com',
      marketAgentEnabled: true,
      marketAgentStatus: 'active',
    });
  });

  afterEach(async () => {
    await cleanupTestUser(testUserId);
  });

  it('should return marketAgentEnabled, limits, and usage rollups for entitled user', async () => {
    const { req, res } = buildReqRes({
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token',
      },
    });

    await handler(req, res);

    const response = getResponseData(res);
    expect(response.statusCode).toBe(200);
    expect(response.body.features.marketAgent.enabled).toBe(true);
    expect(response.body.features.marketAgent.status).toBe('active');
    expect(response.body.limits.marketAgent.runsPerDay).toBe(250);
    expect(response.body.limits.marketAgent.maxItemsPerDay).toBe(20000);
    expect(response.body.usage.marketAgent.today.runs).toBe(10);
    expect(response.body.usage.marketAgent.today.itemsReturned).toBe(500);
  });

  it('should return 401 for unauthenticated request', async () => {
    const { req, res } = buildReqRes({
      method: 'GET',
      headers: {},
    });

    await handler(req, res);

    const response = getResponseData(res);
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toContain('Unauthorized');
  });

  it('should return usage data even when not entitled (locked state)', async () => {
    // Mock entitlements to return disabled
    vi.mocked(require('../../lib/entitlements').getMarketAgentEntitlement).mockResolvedValueOnce({
      enabled: false,
      status: 'canceled',
      graceUntil: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      override: null,
      userId: testUserId,
    });

    const { req, res } = buildReqRes({
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token',
      },
    });

    await handler(req, res);

    const response = getResponseData(res);
    expect(response.statusCode).toBe(200);
    expect(response.body.features.marketAgent.enabled).toBe(false);
  });
});

