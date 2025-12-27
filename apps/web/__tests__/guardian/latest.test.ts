import { it, expect } from 'vitest';
import { LatestResponse } from '@magnus/deploy-guardian-contracts';
import { guardianDescribe, guardianEnabled, guardianFetch } from './helpers';

const suiteName = guardianEnabled
  ? 'GET /api/guardian/latest'
  : 'GET /api/guardian/latest (requires GUARDIAN_BASE_URL + GUARDIAN_API_KEY)';

guardianDescribe(suiteName, () => {
  it('returns a contract-valid latest snapshot', async () => {
    const response = await guardianFetch(
      '/api/guardian/latest?marketplace=facebook'
    );

    expect(response.status).toBe(200);

    const json = await response.json();
    LatestResponse.parse(json);
  });
});
