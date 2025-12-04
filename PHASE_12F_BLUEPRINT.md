# Phase 12F — Azure Container App Auto-Redeploy Blueprint

## Objective

Turn the Magnus Flipper worker triad (scraper, tracker, autosell) into a
**push-to-deploy** system:

- On each main branch deployment:
  - Build workers + packages
  - Build linux/amd64 Docker images
  - Push vX-tagged images to ACR
  - Update Azure Container Apps to the new images
  - Wire secrets/env vars consistently

This removes manual CLI deploys and standardizes the deployment path via GitHub Actions.

---

## Components

### 1. Local helper script

`./scripts/phase-12f-deploy.sh`:

- Sets/refreshes container app secrets:
  - `supabase-url`
  - `supabase-service-role-key`
  - `supabase-anon-key`
- Updates 3 workers to the latest image tag (`v3` ATM):
  - `worker-scraper`
  - `worker-tracker`
  - `worker-autosell`
- Injects env vars using `secretref:`:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_ANON_KEY`
  - `NODE_ENV=production`
  - `LOG_LEVEL=info`
- Verifies status via `az containerapp list`.

Used for:
- Local one-shot redeploys
- Emergency manual redeploy
- Sanity checks outside CI/CD

---

### 2. GitHub Actions Workflow

`.github/workflows/phase-12f-workers-deploy.yml`:

- Triggers:
  - `workflow_dispatch` (manual button)
  - `push` to `main` touching worker or engine code
- Steps:
  - Check out repo
  - Login to Azure (service principal)
  - Login to ACR
  - Install Node + pnpm
  - `pnpm install`
  - `pnpm -r build` (build all packages and workers)
  - Docker build (linux/amd64) for:
    - `worker-scraper`
    - `worker-tracker`
    - `worker-autosell`
  - Tag images as `v${GITHUB_RUN_NUMBER}` and also `latest`
  - Push to ACR
  - `az containerapp update` for all 3 workers:
    - Set image per worker
    - Set env vars referencing secrets
  - Final health check via `az containerapp list`

Secrets used:
- `AZURE_CREDENTIALS`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_RESOURCE_GROUP` (default: `magnus-rg`)
- `AZURE_CONTAINERAPPS_ENV` (default: `magnus-ca-env`)
- `AZURE_CONTAINER_REGISTRY` (e.g. `magnusacr.azurecr.io`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

---

### 3. Deployment Flow (End State)

1. Developer merges to `main`.
2. GitHub Action runs:
   - Builds and pushes new worker images.
   - Updates container apps to new tags.
   - Verifies status.
3. Azure Container Apps:
   - Roll out new revisions.
   - Roll back to previous revision if needed.

Outcome:
- No more manual terminal runs for worker deployment.
- Every deployed version is traceable to a GitHub run.
- Previous versions are trivially roll-backable via Container Apps revisions.

---

### 4. Manual Overrides

If CI is down or you want a manual redeploy:

```bash
./scripts/phase-12f-deploy.sh
```

