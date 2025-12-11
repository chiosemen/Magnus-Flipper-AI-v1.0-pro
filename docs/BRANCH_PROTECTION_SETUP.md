# Branch Protection Setup Guide

## 🛡️ Required Branch Protection Rules for `main`

To ensure DeployGuardian blocks unsafe merges, configure the following branch protection rules in GitHub:

### 1. Basic Settings

**Path:** `Settings > Branches > Branch protection rules > main`

- ✅ **Require a pull request before merging**
  - Required number of approvals: `1`
  - Dismiss stale pull request approvals when new commits are pushed: `✅`
  - Require review from Code Owners: `✅` (if CODEOWNERS file exists)

- ✅ **Require status checks to pass before merging**
  - Required status checks:
    - `validate` (from `deploy-guardian.yml`)
    - `test-and-build` (from `ci-build.yml`)
    - `db-safety` (from `db-safety.yml`)
    - `block-unsafe` (from `pre-merge-guard.yml`)
  - Require branches to be up to date before merging: `✅`

- ✅ **Require conversation resolution before merging**
  - All conversations on the PR must be resolved

- ✅ **Do not allow bypassing the above settings**
  - Even administrators cannot bypass

### 2. Additional Settings

- ✅ **Require linear history**
  - Prevents merge commits, enforces rebase/squash

- ✅ **Include administrators**
  - Apply rules to administrators too

- ✅ **Restrict who can push to matching branches**
  - Only allow specific teams/users (optional)

---

## 📋 Required GitHub Secrets

Ensure these secrets are set in `Settings > Secrets and variables > Actions`:

### Required Secrets

```bash
DATABASE_URL              # PostgreSQL connection string
SUPABASE_URL             # Supabase project URL
SUPABASE_ANON_KEY        # Supabase anonymous key
AZURE_CLIENT_ID          # Azure service principal client ID
AZURE_TENANT_ID          # Azure tenant ID
AZURE_SUBSCRIPTION_ID    # Azure subscription ID
AZURE_ACR_NAME           # Azure Container Registry name
VERCEL_TOKEN             # Vercel deployment token
VERCEL_ORG_ID            # Vercel organization ID
VERCEL_PROJECT_ID        # Vercel project ID
```

### Optional Secrets

```bash
AZURE_CLIENT_SECRET      # Azure service principal secret (if using service principal auth)
SUPABASE_SERVICE_KEY     # Supabase service role key (for admin operations)
```

---

## 🔧 Verification Steps

### 1. Test PR Validation

1. Create a test PR to `main`
2. Verify `deploy-guardian.yml` runs
3. Verify `pre-merge-guard.yml` runs
4. Check PR comment for validation status
5. Attempt to merge (should be blocked if validation fails)

### 2. Test Deployment Validation

1. Merge a valid PR to `main`
2. Verify `one_button_deploy.yml` runs
3. Verify DeployGuardian pre-deploy validation runs
4. Check deployment logs for validation status

### 3. Test Unsafe Merge Blocking

1. Create PR with WIP in title
2. Verify merge is blocked
3. Create PR with failing tests
4. Verify merge is blocked

---

## 🚨 Troubleshooting

### Validation Fails but Should Pass

1. Check GitHub Actions logs
2. Verify all secrets are set
3. Check Terraform/Prisma/Worker build errors
4. Review DeployGuardian output

### Merge Blocked Unexpectedly

1. Check branch protection rules
2. Verify required status checks are passing
3. Check PR for WIP/draft markers
4. Review DeployGuardian unsafe merge check

### Secrets Not Found

1. Verify secrets are set in repository settings
2. Check secret names match exactly
3. Ensure secrets are available to workflows
4. Review workflow environment variable usage

---

## 📊 Status Check Names

When configuring branch protection, use these exact status check names:

- `validate` — DeployGuardian validation
- `test-and-build` — CI build and test
- `db-safety` — Database safety checks
- `block-unsafe` — Pre-merge guard

---

**Note:** After setting up branch protection, test with a real PR to ensure everything works correctly.
