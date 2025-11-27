# Magnus Flipper AI — Production Launch Runbook

## 0. Overview
This runbook orchestrates the release-check workflow, the Azure dry-run workflow, the Azure deploy workflow, and the promote workflow (if present). It does NOT deploy anything itself; it merely describes the sequence operators should follow during a production launch.

## 1. Pre-Launch Week (T-7 to T-2 Days)
- [ ] Main branch is green and merge-ready.
- [ ] `RELEASE-CHECKLIST.md` is completed and confirmed.
- [ ] `infra/azure/terraform.tfvars` is populated and validated.
- [ ] Supabase `DATABASE_URL` + connection policies are confirmed.
- [ ] Stripe & OpenAI live keys are in the secrets store and not test keys.
- [ ] DNS records and `APP_URL` are finalized.

## 2. Code Freeze (T-24 to T-4 Hours)
- [ ] Perform final merge to `main`.
- [ ] Optionally run `pnpm launch:prep` (alias for `pnpm release:full`) locally.
- [ ] Trigger the **Release Check** workflow (see `RELEASE-CHECKLIST.md`).
- [ ] Confirm Release Check passes (lint + tests + build + env verification).

## 3. Infra Dry Run (T-4 to T-2 Hours)
- [ ] Trigger `azure-dry-run.yml` (or `./scripts/deploy/dry-run.sh`).
- [ ] Verify Terraform `init` + `plan` succeed with no diffs.
- [ ] Share the plan summary with the launch team.

## 4. Build & Publish (T-2 to T-1 Hours)
- [ ] Trigger `azure-deploy.yml`.
- [ ] Confirm the workflow builds packages and pushes `magnus-api`, `magnus-worker-*`, `magnus-scheduler` images to ACR.
- [ ] Note that `image_tag` equals the Git SHA used by the workflow.

## 5. Promote to Production (T-1 Hour)
- [ ] If `azure-promote.yml` exists: run it with `image_tag` set to the SHA from deploy.
- [ ] If `azure-promote.yml` is missing: document that the workflow is absent and rely on manual Terraform apply (consider adding the promote workflow later).
- [ ] Ensure Terraform plan + apply succeed during the promotion.

## 6. Post-Deploy Smoke Tests
- [ ] Run `scripts/deploy/smoke.sh "$APP_URL"` (automated in `azure-promote.yml`, documented in `AZURE_DEPLOYMENT.md`).
- [ ] Confirm `/health` returns HTTP 200 before marking the launch successful.

## 7. Rollback Instructions
- [ ] Re-promote the last known stable `image_tag` if a rollback is required.
- [ ] See `AZURE_DEPLOYMENT.md` for more detailed rollback steps.
