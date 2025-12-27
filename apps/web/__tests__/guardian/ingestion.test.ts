import { it, expect } from 'vitest';
import { IngestionRunsResponse } from '@magnus/deploy-guardian-contracts';
import { guardianDescribe, guardianEnv, guardianHeaders } from './helpers';

const suiteName = guardianEnv.hasEnv
  ? 'GET /api/guardian/ingestion/runs'
  : 'GET /api/guardian/ingestion/runs (requires GUARDIAN_BASE_URL + GUARDIAN_API_KEY)';

guardianDescribe(suiteName, () => {
  it('returns contract-valid ingestion runs', async () => {
    const url = new URL('/api/guardian/ingestion/runs', guardianEnv.baseUrl);
    url.searchParams.set('marketplace', 'facebook');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: guardianHeaders(),
    });

    expect(response.status).toBe(200);

    const json = await response.json();
    IngestionRunsResponse.parse(json);
  });
});
