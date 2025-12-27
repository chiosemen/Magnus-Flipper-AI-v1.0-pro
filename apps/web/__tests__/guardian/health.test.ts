import { it, expect } from 'vitest';
import { HealthResponse } from '@magnus/deploy-guardian-contracts';
import { guardianDescribe, guardianEnv, guardianHeaders } from './helpers';

const suiteName = guardianEnv.hasEnv
  ? 'GET /api/guardian/health'
  : 'GET /api/guardian/health (requires GUARDIAN_BASE_URL + GUARDIAN_API_KEY)';

guardianDescribe(suiteName, () => {
  it('returns a contract-valid health response', async () => {
    const response = await fetch(`${guardianEnv.baseUrl}/api/guardian/health`, {
      headers: guardianHeaders(),
    });

    expect(response.status).toBe(200);

    const json = await response.json();
    HealthResponse.parse(json);
  });
});
