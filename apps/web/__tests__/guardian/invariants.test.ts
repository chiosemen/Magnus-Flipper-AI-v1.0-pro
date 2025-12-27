import { it, expect } from 'vitest';
import { InvariantsEvaluateResponse } from '@magnus/deploy-guardian-contracts';
import { guardianDescribe, guardianEnabled, guardianFetch } from './helpers';

const suiteName = guardianEnabled
  ? 'POST /api/guardian/invariants/evaluate'
  : 'POST /api/guardian/invariants/evaluate (requires GUARDIAN_BASE_URL + GUARDIAN_API_KEY)';

guardianDescribe(suiteName, () => {
  it('returns contract-valid invariant evaluation', async () => {
    const response = await guardianFetch('/api/guardian/invariants/evaluate', {
      method: 'POST',
      body: { scope: 'global', window_minutes: 60 },
    });

    expect(response.status).toBe(200);

    const json = await response.json();
    InvariantsEvaluateResponse.parse(json);
  });
});
