# @magnus/deploy-guardian-contracts

Canonical API contracts for the Deploy-Guardian control plane.

## Endpoints

- `GET /api/guardian/health`
- `GET /api/guardian/latest?marketplace=`
- `GET /api/guardian/ingestion/runs?marketplace=&limit=`
- `POST /api/guardian/invariants/evaluate`
- `POST /api/guardian/canary/run`
- `GET /api/guardian/alerts?since=&limit=`

## Usage

```ts
import {
  InvariantsEvaluateRequest,
  InvariantsEvaluateResponse,
} from '@magnus/deploy-guardian-contracts';

const payload = InvariantsEvaluateRequest.parse({
  scope: 'global',
});

const response = await fetch(`${guardianBaseUrl}/api/guardian/invariants/evaluate`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});

const json = await response.json();
InvariantsEvaluateResponse.parse(json);
```

## Build

```sh
pnpm --filter @magnus/deploy-guardian-contracts build
```
