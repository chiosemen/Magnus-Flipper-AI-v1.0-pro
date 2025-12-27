import { it, expect } from 'vitest';
import { AlertsResponse } from '@magnus/deploy-guardian-contracts';
import { guardianDescribe, guardianEnv, guardianHeaders } from './helpers';

const suiteName = guardianEnv.hasEnv
  ? 'GET /api/guardian/alerts'
  : 'GET /api/guardian/alerts (requires GUARDIAN_BASE_URL + GUARDIAN_API_KEY)';

guardianDescribe(suiteName, () => {
  it('returns contract-valid alerts response', async () => {
    const url = new URL('/api/guardian/alerts', guardianEnv.baseUrl);
    url.searchParams.set('limit', '10');

    const response = await fetch(url.toString(), {
      headers: guardianHeaders(),
    });

    expect(response.status).toBe(200);

    const json = await response.json();
    AlertsResponse.parse(json);
  });
});
