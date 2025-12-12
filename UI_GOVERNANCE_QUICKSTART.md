# 🛡️ UI Governance Agents — Quick Start

Three elite Cursor agents ready for Magnus Flipper sprint execution.

---

## ✅ What Was Created

### 1. **UI Layout Auditor** ✅
- **Cursor Agent:** `.cursor/agents/magnus-layout-auditor.json`
- **Script:** `scripts/layout-auditor.ts`
- **Command:** `pnpm layout:audit`

**What it does:**
- Validates layout structure against architecture diagrams
- Checks token usage (spacing, radius, colors, shadows)
- Detects hardcoded values
- Validates motion/animation tokens
- Generates audit reports

### 2. **Component Contract Enforcer** ✅
- **Cursor Agent:** `.cursor/agents/magnus-component-contract-enforcer.json`
- **Script:** `scripts/component-contract-enforcer.ts`
- **Command:** `pnpm contract:enforce`

**What it does:**
- Compares web vs mobile component APIs
- Detects prop mismatches
- Validates variant consistency
- Generates shared contract definitions
- Ensures accessibility parity

### 3. **Screen Blueprint Generator** ✅
- **Cursor Agent:** `.cursor/agents/magnus-screen-blueprint-generator.json`
- **Script:** (Cursor-only, no CLI script)

**What it does:**
- Generates screens from architecture diagrams
- Creates section components
- Wires with layout primitives
- Adds motion animations
- Generates hierarchy reports

---

## 🚀 How to Use

### In Cursor IDE

1. **Load Agents:**
   - Open Cursor Settings → Agents
   - Import the three `.json` files from `.cursor/agents/`
   - Or use Cursor's agent management UI

2. **Activate Agent:**
   - Type the agent name or trigger phrase
   - Example: "Audit UI Layout" or "Generate screen: Dashboard"

### Via Command Line

```bash
# Layout Audit
pnpm layout:audit --component AppShell.tsx

# Contract Enforcement
pnpm contract:enforce --component Button
pnpm contract:generate --component Button

# Screen Generation (Cursor only)
# Use Cursor agent: "Generate screen: Dashboard"
```

---

## 📋 Agent Commands

### Layout Auditor

**Cursor:**
```
Audit UI Layout
Check layout spacing tokens
Validate AppShell structure
```

**CLI:**
```bash
pnpm layout:audit --component <path>
pnpm layout:audit --component AppShell.tsx --strict
```

### Contract Enforcer

**Cursor:**
```
Enforce component contracts
Check Button component parity
Generate contract definitions
```

**CLI:**
```bash
pnpm contract:enforce --component Button
pnpm contract:generate --component Button
```

### Screen Generator

**Cursor:**
```
Generate screen: Dashboard
Generate screen: Affiliate Earnings
Generate screen: Real-time Feed
```

**CLI:** (Not available - Cursor agent only)

---

## 🎯 Example Workflows

### Workflow 1: Pre-Deployment Audit

```bash
# 1. Audit all layout components
pnpm layout:audit --component AppShell.tsx
pnpm layout:audit --component Navbar.tsx
pnpm layout:audit --component SideNav.tsx

# 2. Enforce component contracts
pnpm contract:enforce --component Button
pnpm contract:enforce --component Input
pnpm contract:enforce --component Card

# 3. Review reports
cat LAYOUT_AUDIT_*.md
cat CONTRACT_REPORT_*.md
```

### Workflow 2: New Screen Development

**In Cursor:**
```
1. "Generate screen: Dashboard"
2. Agent generates:
   - apps/web/app/dashboard/page.tsx
   - apps/web/app/(components)/screen-sections/dashboard/*
   - SCREEN_HIERARCHY_Dashboard.md

3. "Audit UI Layout" (on generated screen)
4. Review and iterate
```

### Workflow 3: Cross-Platform Sync

```bash
# 1. Generate contracts for all components
pnpm contract:generate --component Button
pnpm contract:generate --component Input
pnpm contract:generate --component Card

# 2. Enforce contracts (detects mismatches)
pnpm contract:enforce --component Button

# 3. Fix mismatches in web/mobile components
# 4. Re-run enforcement to verify
```

---

## 📊 Output Files

### Layout Auditor
- `LAYOUT_AUDIT_<Component>.md` - Detailed audit report

### Contract Enforcer
- `CONTRACT_REPORT_<Component>.md` - Contract comparison
- `packages/core/ui-contracts/<Component>.types.ts` - Shared contract (if --generate-contracts)

### Screen Generator
- `apps/web/app/<screen>/page.tsx` - Screen file
- `apps/web/app/(components)/screen-sections/<screen>/*` - Section components
- `SCREEN_HIERARCHY_<Screen>.md` - Hierarchy report

---

## 🔧 Configuration

All agents are configured in:
- `.cursor/agents/magnus-layout-auditor.json`
- `.cursor/agents/magnus-component-contract-enforcer.json`
- `.cursor/agents/magnus-screen-blueprint-generator.json`

Edit these files to customize agent behavior.

---

## ✅ Status

**All Three Agents:** ✅ Created and Ready  
**Scripts:** ✅ Executable  
**Documentation:** ✅ Complete  
**NPM Scripts:** ✅ Added  

---

## 🎓 Next Steps

1. **Load agents in Cursor:**
   - Import the three `.json` files
   - Or use Cursor's agent management

2. **Test Layout Auditor:**
   ```bash
   pnpm layout:audit --component AppShell.tsx
   ```

3. **Test Contract Enforcer:**
   ```bash
   pnpm contract:enforce --component Button
   ```

4. **Test Screen Generator:**
   - In Cursor: "Generate screen: TestDashboard"
   - Review generated files

---

**Ready to use!** 🚀
