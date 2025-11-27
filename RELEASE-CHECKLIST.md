# Magnus Flipper AI — Final Pre-Launch Checklist (Azure Edition)

This checklist ensures all critical components are configured, tested, and ready for production deployment on Azure Container Apps.

---

## 1. Branch & Git State

- [ ] `git checkout main`
- [ ] `git pull origin main`
- [ ] Confirm: `git status` → "working tree clean"
- [ ] Confirm: no unfinished feature branches that contain critical changes

---

## 2. Environment & Secrets

### GitHub Secrets (Actions) — REQUIRED

These must be configured in your GitHub repository settings under **Settings → Secrets and variables → Actions**:

- [ ] `AZURE_CREDENTIALS` — Azure service principal credentials (JSON format)
- [ ] `AZURE_SUBSCRIPTION_ID` — Azure subscription ID
- [ ] `AZURE_CONTAINER_REGISTRY` — Azure Container Registry name
- [ ] `AZURE_RESOURCE_GROUP` — Azure resource group name
- [ ] `AZURE_LOCATION` — Azure region (e.g., eastus)
- [ ] `AZURE_CONTAINERAPPS_ENV` — Container Apps environment name
- [ ] `DATABASE_URL` — PostgreSQL connection string (Supabase or Azure PostgreSQL)
- [ ] `SUPABASE_URL` — Supabase project URL
- [ ] `SUPABASE_ANON_KEY` — Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- [ ] `JWT_SECRET` — JWT signing secret for API authentication
- [ ] `STRIPE_SECRET_KEY` — Stripe secret key for payment processing
- [ ] `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- [ ] `OPENAI_API_KEY` — OpenAI API key for AI features
- [ ] `APP_URL` — Application URL (e.g., https://magnus.ai)

### Terraform tfvars — REQUIRED

Create `infra/azure/terraform.tfvars` based on `terraform.tfvars.example`:

- [ ] `subscription_id` — Azure subscription ID
- [ ] `location` — Azure region (e.g., eastus)
- [ ] `resource_group_name` — Resource group name
- [ ] `acr_name` — Container registry name
- [ ] `containerapps_env_name` — Container Apps environment name
- [ ] `database_url` — Database connection string
- [ ] `supabase_url` — Supabase project URL
- [ ] `supabase_anon_key` — Supabase anon key
- [ ] `supabase_service_role_key` — Supabase service role key
- [ ] `jwt_secret` — JWT secret
- [ ] `stripe_secret_key` — Stripe secret key
- [ ] `stripe_webhook_secret` — Stripe webhook secret
- [ ] `openai_key` — OpenAI API key
- [ ] `app_url` — Application URL
- [ ] `node_env` — Node environment (production/staging)
- [ ] `demo_mode` — Demo mode flag (true/false)
- [ ] `log_level` — Logging level (info/debug/warn/error)
- [ ] `image_tag` — Docker image tag (typically git SHA)

**Note:** Never commit `terraform.tfvars` to git. It is listed in `.gitignore`.

---

## 3. Local Build & Test

Run these commands **locally** before creating a release tag:

- [ ] `pnpm install` — Install all dependencies
- [ ] `pnpm lint` — Run linters across all packages
- [ ] `pnpm test` — Run unit tests across all packages
- [ ] `pnpm build` — Build all packages and apps
- [ ] `pnpm test:e2e` — Run Cypress end-to-end tests (optional but recommended)
- [ ] `pnpm release:check` — Run combined lint + test + build checks
- [ ] `pnpm release:verify` — Verify all required environment variables are set

**What each script does:**

- `pnpm build` — Builds all packages and apps in dependency order
- `pnpm release:check` — Runs `lint`, `test`, and `build` sequentially
- `pnpm release:verify` — Checks that all required environment variables are configured

---

## 4. Database & Prisma

Ensure Prisma schema is synced with your Supabase/Azure PostgreSQL database:

- [ ] `pnpm --filter @magnus-flipper-ai/core prisma:generate` — Generate Prisma client
- [ ] `pnpm --filter @magnus-flipper-ai/core prisma:migrate` — Deploy migrations to production database
- [ ] Optional: `ts-node scripts/db/sync.ts` — Verify database connectivity and list tables

**Important:** Run `prisma:migrate` against your production database URL before first deployment. This ensures all tables, indexes, and constraints are created.

---

## 5. Azure Container Apps & Terraform

### Manual Terraform Deployment

If deploying manually (not via GitHub Actions):

- [ ] `cd infra/azure`
- [ ] `terraform init` — Initialize Terraform
- [ ] `terraform plan -var="image_tag=<GIT_SHA>"` — Review infrastructure changes
- [ ] `terraform apply -var="image_tag=<GIT_SHA>"` — Apply changes to Azure

Replace `<GIT_SHA>` with your current git commit SHA (e.g., `git rev-parse --short HEAD`).

### Automated GitHub Actions Deployment

The **`.github/workflows/azure-deploy.yml`** workflow will automatically:

1. Build and push Docker images to Azure Container Registry
2. Run `terraform plan` and `terraform apply` with `image_tag=${{ github.sha }}`
3. Deploy API and all worker jobs to Azure Container Apps

**Workflow triggers:**
- Manual: **Actions → Azure Deploy → Run workflow**
- Automatic: Push to `main` branch (if paths match)

---

## 6. Post-Deploy Smoke Checks

After deployment, verify the system is running correctly:

- [ ] **API Health Check**: `GET https://<your-app-url>/api/health` (or equivalent endpoint)
- [ ] **Login**: Log in as a test user, confirm dashboard loads
- [ ] **Saved Search**: Create a new saved search, verify it persists
- [ ] **Alerts**: Create a test alert, verify it appears in dashboard
- [ ] **Worker Jobs**: Check Azure Portal → Container Apps Jobs → Execution History
  - Verify `worker-alerts-job` executes successfully
  - Verify `worker-crawler-job` executes successfully
  - Verify `worker-scheduler-job` executes successfully
- [ ] **Logs**: Check Azure Portal → Container Apps → Log stream for any errors
- [ ] **Cypress (Optional)**: Run `pnpm test:e2e` against deployed URL

---

## 7. Final Release Steps

Once all checks pass:

- [ ] Create a git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
- [ ] Push the tag: `git push origin v1.0.0`
- [ ] Monitor GitHub Actions for successful deployment
- [ ] Create GitHub Release with changelog
- [ ] Update documentation with production URLs

---

## Troubleshooting

### Build Failures

- Check that all dependencies are installed: `pnpm install`
- Ensure Node.js version matches project requirements (20.x)
- Check TypeScript errors: `pnpm build`

### Terraform Failures

- Verify Azure credentials are valid
- Check resource name conflicts (ACR names must be globally unique)
- Review Terraform state: `terraform state list`

### Runtime Failures

- Check Container Apps logs in Azure Portal
- Verify environment variables are injected correctly
- Check database connectivity: `ts-node scripts/db/sync.ts`

### Environment Variable Issues

- Run `pnpm release:verify` to check which variables are missing
- Ensure GitHub Secrets match Terraform variable names
- Check `.env.example` files for reference

---

**You are ready to launch! 🚀**
