# DeployGuardian v2 - Operator Quick Reference

## 🎯 What is DeployGuardian?

DeployGuardian is a **pre-deployment safety gate** that validates your codebase before deployment. It acts as a **release engineering checkpoint**, not a development linter.

**Key Principle:** Only block deployment on issues that would **break production**.

---

## 🚦 Severity Levels

### ❌ BLOCKER
**Production will break.** Must fix before deploying.

- Invalid Prisma schema syntax
- Invalid Terraform syntax
- Missing build-time secrets (DATABASE_URL)
- Invalid Dockerfile syntax (missing FROM instruction)

### ⚠️ WARNING
**Should be fixed, but won't break production immediately.**

- Missing runtime secrets (will be set in deployment environment)
- Lint errors
- Test failures
- Terraform drift (infrastructure changes)
- TypeScript build warnings

### ℹ️ INFO
**Informational. No action needed.**

- "Multi-stage build detected"
- "Prisma client regenerated"
- "Plan skipped in pre-deploy mode"

---

## 🔧 Usage

### Pre-Deploy Mode (Used in CI/CD)
```bash
node tools/deploy_guardian.js --mode=pre-deploy
```

**Behavior:**
- ✅ Only BLOCKER issues cause exit 1 (fail deployment)
- ⚠️ WARNING issues are logged but don't block
- ℹ️ INFO messages are shown for transparency
- Skips slow operations (Docker builds, Terraform plan)
- Validates build-time requirements only

**Exit Codes:**
- `0` - Safe to deploy (no blockers)
- `1` - Unsafe to deploy (≥1 blocker)

### Validate Mode (For Local Development)
```bash
node tools/deploy_guardian.js --mode=validate
```

**Behavior:**
- Runs all checks including slow operations
- More strict than pre-deploy mode
- Good for pre-commit validation

### Pre-Merge Mode (For Pull Requests)
```bash
node tools/deploy_guardian.js --mode=pre-merge
```

**Behavior:**
- Strict validation for PR merges
- Checks for WIP commits, uncommitted changes
- Ensures code quality before merge

---

## 🩺 Common Issues & Fixes

### ❌ BLOCKER: Invalid Prisma Schema

**Error:**
```
❌ Schema validation failed: ... syntax error ...
```

**Fix:**
```bash
cd packages/core/prisma
npx prisma validate
npx prisma format --schema=./schema.prisma
```

### ❌ BLOCKER: Invalid Terraform Syntax

**Error:**
```
❌ Terraform validate failed (syntax errors): ...
```

**Fix:**
```bash
cd infra/azure
terraform validate
terraform fmt -recursive
```

### ❌ BLOCKER: Missing DATABASE_URL

**Error:**
```
❌ Build-time secret missing: DATABASE_URL
```

**Fix:**
- Add `DATABASE_URL` to GitHub repository secrets:
  - Go to: Repository → Settings → Secrets and variables → Actions
  - Add `DATABASE_URL` with your PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`

### ❌ BLOCKER: Invalid Dockerfile

**Error:**
```
❌ worker-xyz: Dockerfile missing FROM instruction (invalid syntax)
```

**Fix:**
- Open `apps/worker-xyz/Dockerfile`
- Ensure it has a valid `FROM` instruction:
  ```dockerfile
  FROM node:20-slim
  ```

### ⚠️ WARNING: Missing Runtime Secrets

**Warning:**
```
⚠️ Runtime secret missing: SUPABASE_ANON_KEY (ensure it's set in deployment environment)
```

**Action:**
- This is OK in pre-deploy mode
- Ensure secret is set in GitHub Actions secrets or deployment environment
- It won't block deployment but should be fixed before production

### ⚠️ WARNING: Tests Failing

**Warning:**
```
⚠️ Tests are failing
```

**Action:**
- Fix tests before merging to main
- In pre-deploy, this won't block deployment
- In validate mode, this will fail the check

### ⚠️ WARNING: Terraform Drift

**Warning:**
```
⚠️ Terraform plan detected changes or drift
```

**Action:**
- This is informational in pre-deploy
- Infrastructure has changed outside Terraform
- Review drift and apply changes if needed:
  ```bash
  cd infra/azure
  terraform plan
  terraform apply
  ```

---

## 📊 Reading DeployGuardian Output

### Example Output
```
============================================================
📊 Validation Summary
============================================================

terraform            ✅ PASS
  ℹ️  Terraform plan skipped in pre-deploy mode

prisma               ✅ PASS
  ℹ️  Prisma schema syntax valid
  ℹ️  Prisma client regenerated successfully

workers              ✅ PASS
  ℹ️  worker-realtime: Dockerfile syntax valid
  ℹ️  worker-scheduler: Dockerfile syntax valid
  ℹ️  worker-alerts: Dockerfile syntax valid

secrets              ✅ PASS
  ⚠️  Runtime secret missing: SUPABASE_ANON_KEY

unsafe               ✅ PASS
  ⚠️  Lint errors detected

============================================================
Total Checks:       5/5
Blockers:           0
Warnings:           2

Deployment Safety:  ✅ SAFE TO DEPLOY
============================================================
```

### Interpretation
- **Total Checks: 5/5** - All 5 validation categories passed
- **Blockers: 0** - No production-breaking issues
- **Warnings: 2** - Two issues that should be fixed but don't block deployment
- **Deployment Safety: ✅ SAFE TO DEPLOY** - Safe to proceed with deployment

---

## 🎓 Best Practices

### 1. Run Locally Before Pushing
```bash
node tools/deploy_guardian.js --mode=validate
```
Catch issues early in your local environment.

### 2. Fix Blockers Immediately
Never ignore BLOCKER issues. They will break production.

### 3. Address Warnings During Development
Warnings won't block deployment, but they should be fixed:
- Fix lint errors
- Fix test failures
- Address missing runtime secrets

### 4. Monitor Pre-Deploy Logs
Even when deployment succeeds, review the logs for warnings.

### 5. Understand Your Deployment Environment
- **Pre-deploy:** Validates build-time requirements
- **Deployment:** Runtime secrets are checked by deployment system
- **Post-deploy:** Monitor application health

---

## 🔍 Troubleshooting

### DeployGuardian Passes But Deployment Fails

**Possible Causes:**
- Runtime secrets not set in deployment environment
- Infrastructure issues (Azure/Vercel configuration)
- Network/connectivity issues

**Action:**
- Check deployment logs
- Verify secrets in deployment environment
- Check infrastructure status

### DeployGuardian Fails on Valid Code

**Possible Causes:**
- False positive (report as bug)
- Environment-specific issue (missing dependencies)

**Action:**
- Review the specific error message
- Check severity level (BLOCKER vs WARNING)
- Run with verbose logging if needed

### Deployment Blocked by Warning

**This should not happen in pre-deploy mode.**

If warnings are blocking deployment:
1. Check the mode: `--mode=pre-deploy`
2. Review exit code logic
3. File a bug report

---

## 📞 Support

### Report Issues
- File GitHub issue with:
  - Full DeployGuardian output
  - Mode used (pre-deploy, validate, pre-merge)
  - Expected vs actual behavior

### Request Features
- New validation checks
- Improved error messages
- Additional severity levels

---

## 📚 Related Documentation

- [DeployGuardian v2 Hardening Report](../DEPLOYGUARDIAN_V2_HARDENING_REPORT.md) - Technical details
- [One-Button Deploy](../.github/workflows/one_button_deploy.yml) - CI/CD integration
- [Terraform Drift Surgeon](./TERRAFORM_DRIFT_SURGEON.md) - Terraform-specific tooling
- [Prisma Build Surgeon](./PRISMA_BUILD_SURGEON.md) - Prisma-specific tooling

---

**DeployGuardian v2: Trustworthy. Deterministic. Operator-friendly.** ✅
