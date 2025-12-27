import { it, expect } from 'vitest';
import { CanaryRunResponse } from '@magnus/deploy-guardian-contracts';
import { guardianDescribe, guardianEnv, guardianHeaders } from './helpers';

const suiteName = guardianEnv.hasEnv
  ? 'POST /api/guardian/canary/run'
  : 'POST /api/guardian/canary/run (requires GUARDIAN_BASE_URL + GUARDIAN_API_KEY)';

guardianDescribe(suiteName, () => {
  it('returns contract-valid canary results', async () => {
    const response = await fetch(`${guardianEnv.baseUrl}/api/guardian/canary/run`, {
      method: 'POST',
      headers: {
        ...guardianHeaders(),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ targets: ['api'], mode: 'read-only' }),
    });

    expect(response.status).toBe(200);

    const json = await response.json();
    CanaryRunResponse.parse(json);
  });
});
