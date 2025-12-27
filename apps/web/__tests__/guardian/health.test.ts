import { it, expect } from 'vitest';
import { HealthResponse } from '@magnus/deploy-guardian-contracts';
import { guardianDescribe, guardianEnabled, guardianFetch } from './helpers';

const suiteName = guardianEnabled
  ? 'GET /api/guardian/health'
  : 'GET /api/guardian/health (requires GUARDIAN_BASE_URL + GUARDIAN_API_KEY)';

guardianDescribe(suiteName, () => {
  it('returns a contract-valid health response', async () => {
    const response = await guardianFetch('/api/guardian/health');

    expect(response.status).toBe(200);

    const json = await response.json();
    HealthResponse.parse(json);
  });
});
