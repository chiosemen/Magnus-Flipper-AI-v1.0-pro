# 🛡️ UI Governance Agents — Magnus Flipper AI

Three elite Cursor agents for high-stakes UI governance and sprint execution.

---

## 🟣 Agent 1: UI Layout Auditor

**Purpose:** Validates layout structure against architecture diagrams and design tokens.

### Capabilities

- ✅ Validates component structure (AppShell, Navbar, SideNav, PageHeader)
- ✅ Checks naming conventions
- ✅ Validates token usage (spacing, radius, colors, shadows)
- ✅ Validates motion/animation tokens
- ✅ Detects layout hierarchy drift
- ✅ Generates detailed audit reports

### Usage

**In Cursor:**
```
Audit UI Layout
Check layout spacing tokens
Validate AppShell structure
```

**Via Script:**
```bash
# Audit specific component
pnpm layout:audit --component apps/web/app/(components)/layout/AppShell.tsx

# Strict mode (exits on critical issues)
pnpm layout:audit --component AppShell.tsx --strict
```

### Output

- `LAYOUT_AUDIT_<Component>.md` - Detailed audit report
- Console output with violations
- Actionable fixes with file paths

---

## 🔒 Agent 2: Component Contract Enforcer

**Purpose:** Ensures API consistency between web and mobile components.

### Capabilities

- ✅ Compares web vs mobile component APIs
- ✅ Detects prop mismatches
- ✅ Validates variant consistency
- ✅ Checks event handler parity
- ✅ Validates accessibility props
- ✅ Generates shared contract definitions

### Usage

**In Cursor:**
```
Enforce component contracts
Check Button component parity
Generate contract definitions
```

**Via Script:**
```bash
# Compare web and mobile contracts
pnpm contract:enforce --component Button

# Generate shared contract definition
pnpm contract:generate --component Button
```

### Output

- `CONTRACT_REPORT_<Component>.md` - Contract comparison report
- `packages/core/ui-contracts/<Component>.types.ts` - Shared contract definition
- Mismatch summary with fixes

---

## 🎨 Agent 3: Screen Blueprint Generator

**Purpose:** Generates production-ready screens from architecture diagrams.

### Capabilities

- ✅ Converts architecture diagrams → code
- ✅ Generates screen layout files
- ✅ Creates supporting section components
- ✅ Wires UI with tokens and layout primitives
- ✅ Adds motion animations
- ✅ Generates routing structure
- ✅ Creates screen hierarchy reports

### Usage

**In Cursor:**
```
Generate screen: Dashboard
Generate screen: Affiliate Earnings
Generate screen: Real-time Feed
```

**Workflow:**
1. Provide architecture diagram or mockup reference
2. Agent breaks down into sections
3. Generates screen + section components
4. Wires with layout primitives
5. Adds motion and accessibility
6. Generates hierarchy report

### Output Structure

```
apps/web/app/
  └── dashboard/
      └── page.tsx                    # Main screen
      
apps/web/app/(components)/screen-sections/
  └── dashboard/
      ├── DashboardStats.tsx
      ├── DashboardCharts.tsx
      └── DashboardTable.tsx
      
SCREEN_HIERARCHY_Dashboard.md         # Hierarchy report
```

---

## 🚀 Quick Reference

### All Agents

| Agent | Cursor Command | Script Command |
|-------|---------------|----------------|
| Layout Auditor | `Audit UI Layout` | `pnpm layout:audit` |
| Contract Enforcer | `Enforce component contracts` | `pnpm contract:enforce` |
| Screen Generator | `Generate screen: <Name>` | (Cursor only) |

### Common Workflows

#### 1. Pre-Deployment Audit
```bash
# Audit all layouts
pnpm layout:audit --component AppShell.tsx
pnpm layout:audit --component Navbar.tsx
pnpm layout:audit --component SideNav.tsx

# Enforce contracts
pnpm contract:enforce --component Button
pnpm contract:enforce --component Input
pnpm contract:enforce --component Card
```

#### 2. New Screen Development
```
1. Generate screen: Dashboard
2. Review generated hierarchy report
3. Audit UI Layout (on generated screen)
4. Test and iterate
```

#### 3. Cross-Platform Sync
```bash
# Generate contracts for all components
pnpm contract:generate --component Button
pnpm contract:generate --component Input
pnpm contract:generate --component Card

# Enforce contracts
pnpm contract:enforce --component Button
```

---

## 📋 Agent Prompts

All agents are saved as Cursor agent configurations:

- `.cursor/agents/magnus-layout-auditor.json`
- `.cursor/agents/magnus-component-contract-enforcer.json`
- `.cursor/agents/magnus-screen-blueprint-generator.json`

Load these in Cursor to activate the agents.

---

## 🎯 Integration with Existing Tools

These agents work alongside:

- ✅ **Token Drift Detector** - Validates token consistency
- ✅ **Figma Sync Script** - Syncs design tokens
- ✅ **Theme Provider** - Ensures theme compatibility
- ✅ **Layout Primitives** - Uses AppShell, Navbar, etc.

---

## 🔮 Future Enhancements

Potential additions:

- **Cross-Agent Orchestrator** - Coordinates all agents
- **Figma → Code Diff Assistant** - Auto-rewrites on design changes
- **Testing Supervisor** - Ensures 100% UI coverage
- **Layout Stress Tester** - Automated visual QA

---

## 📚 Documentation

- **Layout Auditor:** See `scripts/layout-auditor.ts`
- **Contract Enforcer:** See `scripts/component-contract-enforcer.ts`
- **Screen Generator:** Use Cursor agent (no script needed)

---

**Status:** ✅ All three agents ready for use  
**Last Updated:** Phase 2 Complete
