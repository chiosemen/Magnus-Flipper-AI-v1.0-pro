# 🚀 Back to Product: Transition Plan

**Status:** Infrastructure recovery complete → Product velocity mode  
**Effective Date:** Immediate  
**Review Date:** 2 weeks from now

---

## 📊 Remaining Infrastructure Work Classification

### ❌ BLOCKERS (None)
*All critical infrastructure is stable. No blockers to product work.*

### ⚠️ NON-BLOCKERS (Documented, not urgent)
- **DeployGuardian re-enablement** — Phased approach planned (PR #4 in backlog)
- **Worker-alerts production wiring** — Email/Slack/SMS providers (TODOs in code)
- **Database migrations** — Agentic engine tables (documented, not blocking)
- **Environment variables matrix** — Partially documented, sufficient for current work

### 💡 NICE-TO-HAVE (Future optimization)
- Project references for TypeScript (dist-only imports)
- Enhanced observability dashboards
- Advanced CI optimizations
- Production hardening enhancements

---

## 🔒 Infrastructure Change Freeze Rules

### ✅ ALLOWED (Emergency only)
- **Critical security patches** — Zero-day vulnerabilities, exposed secrets
- **Production outages** — Service down, data loss risk
- **Compliance fixes** — Legal/regulatory requirements

### ❌ FROZEN (Requires explicit approval)
- **DeployGuardian changes** — Must remain disabled until PR #4
- **CI workflow modifications** — No changes to `.github/workflows/*` or `azure-pipelines.yml`
- **Build system changes** — No `tsconfig.json`, `package.json`, or build script changes
- **Docker/container changes** — No Dockerfile modifications
- **Monorepo structure** — No package/app restructuring
- **TypeScript config normalization** — Current state is stable

**Exception Process:** If infrastructure change is truly needed:
1. Create issue with `[INFRA-EXCEPTION]` prefix
2. Get explicit approval from tech lead
3. Document why it can't wait
4. Keep change minimal and reversible

---

## 🎯 Product Sprint Zero Plan

### ✅ SAFE TO BUILD IMMEDIATELY

**Frontend (apps/web)**
- ✅ New pages and routes
- ✅ Component development
- ✅ API route handlers (backend logic)
- ✅ UI/UX improvements
- ✅ Feature flags and A/B tests
- ✅ Database queries (via existing Prisma client)

**Backend (apps/api, packages/core)**
- ✅ Business logic in existing services
- ✅ New API endpoints
- ✅ Database schema additions (migrations)
- ✅ Background job logic
- ✅ Integration with external APIs

**Workers (apps/worker-*)**
- ✅ Business logic improvements
- ✅ New job handlers
- ✅ Data processing enhancements
- ✅ Alert/notification logic

**Mobile (apps/mobile)**
- ✅ UI components
- ✅ Screen implementations
- ✅ Navigation flows
- ✅ API integration

### ❌ DO NOT TOUCH

**Infrastructure Files**
- ❌ `.github/workflows/*` — CI workflows
- ❌ `azure-pipelines.yml` — Azure CI
- ❌ `tools/deploy_guardian.js` — DeployGuardian
- ❌ `Dockerfile*` — Container configs
- ❌ `tsconfig.json` — TypeScript configs (unless fixing type errors in your code)
- ❌ `package.json` — Dependencies (unless adding new product dependencies)
- ❌ `pnpm-workspace.yaml` — Workspace config

**Build System**
- ❌ Build scripts in `package.json`
- ❌ Turbo config (`turbo.json`)
- ❌ Prisma schema structure (can add tables, don't restructure)

**CI/CD**
- ❌ GitHub Actions workflows
- ❌ Azure Pipelines
- ❌ Deployment scripts
- ❌ Environment variable management in CI

---

## 📋 Product Work Checklist

### Before Starting Work
- [ ] Verify `pnpm --filter <your-app> build` passes locally
- [ ] Check that CI is green on `main` branch
- [ ] Review this document for frozen areas
- [ ] Create feature branch from `main`

### During Development
- [ ] Keep PRs focused (1 feature, < 500 lines changed)
- [ ] Run `pnpm --filter <your-app> build` before committing
- [ ] Run `pnpm lint` if available for your app
- [ ] Test locally before pushing
- [ ] Avoid touching infrastructure files

### PR Submission
- [ ] PR title follows: `feat(scope): description` or `fix(scope): description`
- [ ] PR description explains what and why
- [ ] No changes to frozen infrastructure files
- [ ] CI passes (DeployGuardian will auto-skip)
- [ ] Code review requested

### After Merge
- [ ] Verify deployment succeeded (check GitHub Actions)
- [ ] Test in staging/production if applicable
- [ ] Monitor for errors (check logs)

---

## 🛡️ Lightweight Guardrails

### Automated Checks
1. **CI Path Filters** — Web/mobile lint only runs when relevant files change
2. **DeployGuardian Kill Switch** — Disabled via `CI_DEPLOY_GUARDIAN_DISABLED=true`
3. **Build Validation** — TypeScript builds must pass

### Manual Checks (Weekly)
- Review PRs for infrastructure file changes
- Monitor CI stability metrics
- Check for accidental dependency additions

### Code Review Guidelines
- **Red Flag:** Changes to `.github/workflows/*`, `azure-pipelines.yml`, `tools/deploy_guardian.js`
- **Yellow Flag:** Changes to `tsconfig.json`, `package.json` (verify it's product-related)
- **Green Flag:** Changes to `apps/*/src/**`, `packages/*/src/**`

---

## 🎯 Success Metrics (2 Weeks)

### Infrastructure Stability
- ✅ Zero CI failures from infrastructure changes
- ✅ Zero DeployGuardian re-enablement attempts
- ✅ Zero accidental infrastructure file modifications

### Product Velocity
- ✅ 5+ product PRs merged
- ✅ 0 infrastructure PRs (unless emergency)
- ✅ All PRs pass CI on first try

### Team Confidence
- ✅ Clear boundaries understood
- ✅ No "wait, can I change X?" questions
- ✅ Smooth product development flow

---

## 📞 Emergency Contacts

**Infrastructure Emergency:**
- Create issue with `[INFRA-EMERGENCY]` prefix
- Tag tech lead immediately
- Document impact and proposed fix

**CI/CD Issues:**
- Check GitHub Actions status page
- Review recent commits for changes
- Revert if necessary (infra changes should be rare)

---

## 📅 Review Schedule

- **Week 1 Check-in:** Review PR patterns, adjust if needed
- **Week 2 Review:** Full assessment, decide on DeployGuardian re-enablement timeline
- **Ongoing:** Monitor for infrastructure drift

---

**Last Updated:** 2025-12-12  
**Next Review:** 2025-12-26

