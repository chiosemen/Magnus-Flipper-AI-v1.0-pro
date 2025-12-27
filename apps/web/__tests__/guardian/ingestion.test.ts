import { it, expect } from 'vitest';
import { IngestionRunsResponse } from '@magnus/deploy-guardian-contracts';
import { guardianDescribe, guardianEnabled, guardianFetch } from './helpers';

const suiteName = guardianEnabled
  ? 'GET /api/guardian/ingestion/runs'
  : 'GET /api/guardian/ingestion/runs (requires GUARDIAN_BASE_URL + GUARDIAN_API_KEY)';

guardianDescribe(suiteName, () => {
  it('returns contract-valid ingestion runs', async () => {
    const response = await guardianFetch(
      '/api/guardian/ingestion/runs?marketplace=facebook&limit=1'
    );

    expect(response.status).toBe(200);

    const json = await response.json();
    IngestionRunsResponse.parse(json);
  });
});
