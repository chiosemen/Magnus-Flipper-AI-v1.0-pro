import { it, expect } from 'vitest';
import { CanaryRunResponse } from '@magnus/deploy-guardian-contracts';
import { guardianDescribe, guardianEnabled, guardianFetch } from './helpers';

const suiteName = guardianEnabled
  ? 'POST /api/guardian/canary/run'
  : 'POST /api/guardian/canary/run (requires GUARDIAN_BASE_URL + GUARDIAN_API_KEY)';

guardianDescribe(suiteName, () => {
  it('returns contract-valid canary results', async () => {
    const response = await guardianFetch('/api/guardian/canary/run', {
      method: 'POST',
      body: { targets: ['api'], mode: 'read-only' },
    });

    expect(response.status).toBe(200);

    const json = await response.json();
    CanaryRunResponse.parse(json);
  });
});
