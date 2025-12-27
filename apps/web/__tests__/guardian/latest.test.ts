import { it, expect } from 'vitest';
import { LatestResponse } from '@magnus/deploy-guardian-contracts';
import { guardianDescribe, guardianEnv, guardianHeaders } from './helpers';

const suiteName = guardianEnv.hasEnv
  ? 'GET /api/guardian/latest'
  : 'GET /api/guardian/latest (requires GUARDIAN_BASE_URL + GUARDIAN_API_KEY)';

guardianDescribe(suiteName, () => {
  it('returns a contract-valid latest snapshot', async () => {
    const url = new URL('/api/guardian/latest', guardianEnv.baseUrl);
    url.searchParams.set('marketplace', 'facebook');

    const response = await fetch(url.toString(), {
      headers: guardianHeaders(),
    });

    expect(response.status).toBe(200);

    const json = await response.json();
    LatestResponse.parse(json);
  });
});
