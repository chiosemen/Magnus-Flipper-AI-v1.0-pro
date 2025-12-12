# CI Invariant Contract

**Version**: 1.0  
**Last Updated**: 2025-12-12  
**Enforced By**: CI Preflight Guardian

---

## Absolute Rules

1. **DO NOT silence errors** - All failures must be explicit
2. **DO NOT skip checks** - All validation steps must run
3. **DO NOT weaken TypeScript** - Strict mode required, no `any` escapes
4. **DO NOT add "|| true"** - Failures must propagate
5. **CI must match production** - Dependency order must reflect runtime
6. **Workspace packages first** - Must build before consumer type-check
7. **Fail fast** - Stop on first failure, no cascading errors

---

## Invariant Pipeline Order

Every CI job MUST follow this exact order:

### 1. Checkout Repository
```yaml
- name: 📥 Checkout repository
  uses: actions/checkout@v4
```

### 2. Setup Node 20 + pnpm
```yaml
- name: 🟦 Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: "20"
    cache: "pnpm"

- name: 🟣 Install pnpm
  run: |
    npm install -g pnpm
    pnpm --version
```

### 3. Preflight Validation
```yaml
- name: 🛡️ CI Preflight
  run: bash scripts/ci-preflight.sh
```

**Preflight validates:**
- Node 20 version
- pnpm installation
- Lockfile existence
- Package.json structure
- Workspace structure
- Required scripts existence

**If preflight fails → CI stops immediately**

### 4. Install Dependencies
```yaml
- name: 📦 Install dependencies
  run: pnpm -w install --frozen-lockfile
```

**MUST use `--frozen-lockfile`** - No lockfile modifications in CI

### 5. Build Workspace Packages
```yaml
- name: 🔨 Build workspace packages
  run: pnpm build:packages
```

**CRITICAL**: This MUST run before any consumer type-check or test that depends on workspace packages.

**Why**: TypeScript needs compiled type definitions from `@magnus-flipper-ai/*` packages.

### 6. Lint (Consumer-Specific)
```yaml
# For web
- name: 🔍 Lint
  run: pnpm --filter web lint

# For mobile
- name: 🔍 Lint
  run: pnpm --filter @magnus-flipper-ai/mobile lint
```

### 7. Type-Check (Consumer-Specific)
```yaml
# For web
- name: 📝 Type check
  run: pnpm --filter web typecheck

# For mobile
- name: 📝 Type check
  run: pnpm --filter @magnus-flipper-ai/mobile type-check
```

**Note**: Mobile uses `type-check`, web uses `typecheck` (both valid)

### 8. Test (If Script Exists)
```yaml
- name: 🧪 Run tests
  run: pnpm --filter web test
```

**Only run if test script exists in package.json**

### 9. Build (If Script Exists)
```yaml
# For web (includes build:packages)
- name: 🏗️ Build web app
  run: pnpm build:web

# Mobile builds handled by EAS (not in CI)
```

---

## Package Name Mapping

| Package | Filter | Package.json Name |
|---------|--------|-------------------|
| Web | `web` | `"name": "web"` |
| Mobile | `@magnus-flipper-ai/mobile` | `"name": "@magnus-flipper-ai/mobile"` |

**Filters MUST match package.json name exactly**

---

## Script Name Mapping

| Consumer | Lint Script | Type-Check Script | Test Script | Build Script |
|----------|-------------|-------------------|-------------|--------------|
| Web | `lint` | `typecheck` | `test` | `build` |
| Mobile | `lint` | `type-check` | N/A | N/A (EAS) |

---

## Workspace Package Dependencies

**Mobile depends on:**
- `@magnus-flipper-ai/core`
- `@magnus-flipper-ai/ui-config` (if exists)

**Web depends on:**
- `@magnus-flipper-ai/core`
- `@magnus-flipper-ai/ui` (if exists)
- All `@magnus-flipper-ai/*` packages

**All workspace packages MUST be built before consumer type-check**

---

## Preflight Gate

**Location**: `scripts/ci-preflight.sh`

**Runs**: Before install step in ALL CI jobs

**Validates**:
1. Node 20 version
2. pnpm installation
3. Lockfile existence
4. Package.json structure
5. Workspace structure
6. Required scripts

**Output**: `CI_PREFLIGHT_REPORT.md`

**Behavior**: Exits non-zero on first failure, stops CI immediately

---

## CI Workflow Structure

### CI-Mobile
- **File**: `.github/workflows/ci-mobile.yml`
- **Jobs**: `lint-and-typecheck`
- **Triggers**: Changes to `apps/mobile/**`, `packages/core/**`

### CI-Web
- **File**: `.github/workflows/ci-web.yml`
- **Jobs**: `lint-and-typecheck`, `test`, `build`
- **Triggers**: Changes to `apps/web/**`, `packages/ui/**`, `packages/core/**`

---

## Error Handling

**All steps MUST:**
- Exit non-zero on failure
- Not use `|| true` or error suppression
- Provide clear error messages
- Fail fast (stop immediately)

**Preflight failures:**
- Block all subsequent steps
- Generate detailed report
- Exit with code 1

---

## Optimization Guidelines

**Allowed:**
- pnpm cache in GitHub Actions
- Path-based workflow triggers
- Parallel jobs (after preflight passes)
- Timeout limits

**Not Allowed:**
- Skipping validation steps
- Reducing strictness
- Introducing non-determinism
- Sharing build artifacts between jobs (adds complexity)

---

## Verification

Before merging any CI changes:

1. ✅ Run `bash scripts/ci-preflight.sh` locally
2. ✅ Verify workflow YAML syntax
3. ✅ Confirm all filters match package.json names
4. ✅ Confirm all scripts exist
5. ✅ Confirm build:packages runs before type-check
6. ✅ Test in CI (push to branch)

---

## Enforcement

**This contract is enforced by:**
- Preflight script (validates structure)
- CI workflows (enforce order)
- Code review (validate changes)

**Violations will:**
- Cause preflight to fail
- Block CI execution
- Require immediate fix

---

## Changelog

- **2025-12-12**: Initial contract established
- **2025-12-12**: Added build:packages requirement
- **2025-12-12**: Added preflight gate
- **2025-12-12**: Fixed CI-Web violations

