# 🚀 Quick Start for Contributors

## ✅ What You Can Build

**All product features are fair game:**
- New pages, components, API routes
- Database migrations (new tables/columns)
- Business logic improvements
- UI/UX enhancements
- Integration with external APIs

## ❌ What's Frozen

**Infrastructure is locked down:**
- CI/CD workflows (`.github/workflows/*`, `azure-pipelines.yml`)
- Build system configs (`tsconfig.json`, `package.json` structure)
- DeployGuardian (`tools/deploy_guardian.js`)
- Docker/container configs
- Monorepo structure

**Why?** We just stabilized infrastructure. Product work is the priority.

## 🛠️ Development Workflow

```bash
# 1. Start from main
git checkout main
git pull
git checkout -b feat/my-feature

# 2. Build your app locally
pnpm --filter <your-app> build

# 3. Develop and test
# ... make your changes ...

# 4. Verify before PR
pnpm --filter <your-app> build  # Must pass
pnpm lint  # If available

# 5. Create PR
git push origin feat/my-feature
# Open PR on GitHub
```

## 📝 PR Guidelines

- **Keep it focused:** One feature per PR
- **Keep it small:** < 500 lines changed
- **Title format:** `feat(scope): description` or `fix(scope): description`
- **No infra files:** Don't touch workflows, build configs, or DeployGuardian

## 🚨 If You Need Infrastructure Changes

1. Create issue with `[INFRA-EXCEPTION]` prefix
2. Explain why it can't wait
3. Get approval before proceeding
4. Keep change minimal and reversible

## 📚 Full Documentation

See [BACK_TO_PRODUCT_PLAN.md](./BACK_TO_PRODUCT_PLAN.md) for complete details.

---

**Questions?** Check the plan doc or ask in team chat.

