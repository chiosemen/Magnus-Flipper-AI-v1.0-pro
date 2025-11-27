# Secrets & Environment Variables Map

This document is the single source of truth for all secrets and environment variables used by:

- GitHub Actions
- Terraform (`infra/azure`)
- Azure Container Apps & Jobs
- Node.js / Next.js / workers (`env.ts`)
- Release verification scripts

---

## 1. Core Runtime Secrets (Database & Supabase)

| Concern        | GitHub Secret Name        | Terraform Variable            | Azure Secret Name             | Runtime Env Var               | Used In Files                                                              |
|----------------|---------------------------|-------------------------------|-------------------------------|-------------------------------|---------------------------------------------------------------------------|
| Primary DB URL | `DATABASE_URL`            | `database_url`                | `database-url`                | `DATABASE_URL`                | `infra/azure/main.tf`, `apps/*/env.ts`, `packages/core/src/db.ts`, `scripts/db/sync.ts` |
| Supabase URL   | `SUPABASE_URL`            | `supabase_url`                | `supabase-url`                | `SUPABASE_URL`                | `infra/azure/main.tf`, `apps/*/env.ts`                                    |
| Supabase Anon  | `SUPABASE_ANON_KEY`        | `supabase_anon_key`           | *(not secret on apps)*        | `SUPABASE_ANON_KEY`            | `apps/api/src/env.ts`, release scripts                                    |
| Supabase SR Key| `SUPABASE_SERVICE_ROLE_KEY`| `supabase_service_role_key`   | `supabase-service-role-key`   | `SUPABASE_SERVICE_ROLE_KEY`   | `infra/azure/main.tf`, workers’ `env.ts`, release scripts                 |

> **Note:** Keep the service role key on backend/worker-only surfaces.

---

## 2. Authentication & Security

| Concern    | GitHub Secret Name | Terraform Variable | Azure Secret Name | Runtime Env Var | Used In Files                         |
|------------|--------------------|--------------------|-------------------|-----------------|---------------------------------------|
| JWT Secret | `JWT_SECRET`       | `jwt_secret`       | `jwt-secret`      | `JWT_SECRET`    | `apps/api/src/env.ts`, release scripts |

---

## 3. Payments (Stripe)

| Concern             | GitHub Secret Name        | Terraform Variable       | Azure Secret Name        | Runtime Env Var        | Used In Files                                  |
|---------------------|---------------------------|--------------------------|--------------------------|------------------------|-----------------------------------------------|
| Stripe Secret Key   | `STRIPE_SECRET_KEY`       | `stripe_secret_key`      | `stripe-secret-key`      | `STRIPE_SECRET_KEY`    | `infra/azure/main.tf`, `apps/api/src/env.ts`  |
| Stripe Webhook      | `STRIPE_WEBHOOK_SECRET`   | `stripe_webhook_secret`  | `stripe-webhook-secret`  | `STRIPE_WEBHOOK_SECRET`| `infra/azure/main.tf`, `apps/api/src/env.ts`  |

---

## 4. AI Services

| Concern        | GitHub Secret Name | Terraform Variable | Azure Secret Name | Runtime Env Var    | Used In Files                                   |
|----------------|--------------------|--------------------|-------------------|--------------------|------------------------------------------------|
| OpenAI API Key | `OPENAI_API_KEY`   | `openai_key`       | `openai-key`      | `OPENAI_API_KEY`   | `infra/azure/main.tf`, `apps/api/src/env.ts`   |

---

## 5. Application Settings

| Concern         | GitHub Secret / Value | Terraform Variable | Azure Env / Value      | Runtime Env Var | Used In Files                                           |
|-----------------|------------------------|--------------------|------------------------|-----------------|--------------------------------------------------------|
| App URL         | `APP_URL`              | `app_url`          | env `APP_URL`          | `APP_URL`       | `infra/azure/main.tf`, `scripts/deploy/smoke.sh`       |
| Node Environment| `"production"`         | `node_env`         | env `NODE_ENV`         | `NODE_ENV`      | `apps/*/env.ts`, logging configs                        |
| Demo Mode       | `"false"`/secret       | `demo_mode`        | env `DEMO_MODE`        | `DEMO_MODE`     | `apps/api/src/env.ts`, feature flags                   |
| Log Level       | `"info"`/secret         | `log_level`        | env `LOG_LEVEL`        | `LOG_LEVEL`     | `apps/*/env.ts`, runtime logging                        |
| Image Tag       | *(CI override)*        | `image_tag`        | *(not an Azure secret)*| *(N/A)*         | `infra/azure/main.tf`, workflows (Plan/Apply steps)     |

---

## 6. Azure Infrastructure Credentials

| Concern         | GitHub Secret Name     | Terraform Variable | Used In Files                                                                 |
|-----------------|------------------------|--------------------|-------------------------------------------------------------------------------|
| Azure Login     | `AZURE_CREDENTIALS`    | *(none - JSON login)* | `.github/workflows/azure-deploy.yml`, `azure-dry-run.yml`, `azure-promote.yml` |
| Subscription ID | `AZURE_SUBSCRIPTION_ID`| `subscription_id`  | Workflows + `infra/azure/variables.tf`                                        |

---

## 7. Release & Verification Scripts

- `scripts/deploy/verify.mjs` requires `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `OPENAI_API_KEY`, `APP_URL`, and `NODE_ENV`.
- `.github/workflows/release-check.yml` wires the same secrets into the runner and runs `pnpm release:check` / `pnpm release:verify`.

---

## 8. Consistency Guidance

1. Always update this map when adding a new secret or variable.
2. Keep `infra/azure/variables.tf`, GitHub secrets, and runtime `env.ts` uses aligned.
3. Terraform `TF_VAR_*` environment variables should be populated from these GitHub secrets during CI runs.

This file is the ground truth for the entire infra stack.
