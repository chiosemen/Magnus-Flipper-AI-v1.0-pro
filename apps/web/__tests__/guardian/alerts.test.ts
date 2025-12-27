import { it, expect } from 'vitest';
import { AlertsResponse } from '@magnus/deploy-guardian-contracts';
import { guardianDescribe, guardianEnabled, guardianFetch } from './helpers';

const suiteName = guardianEnabled
  ? 'GET /api/guardian/alerts'
  : 'GET /api/guardian/alerts (requires GUARDIAN_BASE_URL + GUARDIAN_API_KEY)';

guardianDescribe(suiteName, () => {
  it('returns contract-valid alerts response', async () => {
    const response = await guardianFetch('/api/guardian/alerts?limit=10');

    expect(response.status).toBe(200);

    const json = await response.json();
    AlertsResponse.parse(json);
  });
});
