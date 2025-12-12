# Sprint 1 — Full Frontend Pass — Execution Plan

## 📋 Phase Mapping

**Sprint 1 maps to:**
- **Phase 1**: Figma System & Base UI Kit ✅ (tokens.ts, plugin.ts exist)
- **Phase 2**: Tailwind Theme + UI Integration ⚠️ (wired but components use hardcoded colors)
- **Phase 3**: First-pass screens (dashboard, deals list, deal detail, profit calculator) ⚠️ (partial)

---

## 🎯 Sprint Step Plan (8 Steps)

### Step 1: ✅ **EXECUTE-HERE** — Inspect Current State
**Status**: Complete
- ✅ `packages/ui/theme/tokens.ts` exists and is comprehensive
- ✅ `packages/ui/theme/plugin.ts` exports Tailwind preset
- ✅ `packages/ui/tailwind-preset.js` exists
- ✅ `apps/web/tailwind.config.mjs` is wired to preset
- ⚠️ Layout components use hardcoded colors instead of tokens
- ⚠️ Dashboard page doesn't use AppShell layout

### Step 2: ✅ **EXECUTE-HERE** — Update Layout Components to Use Tokens
**Status**: In Progress
- Update `apps/web/src/components/layout/AppShell.tsx`
- Update `apps/web/src/components/layout/Sidebar.tsx`
- Update `apps/web/src/components/layout/TopNav.tsx`
- Replace all hardcoded colors with token-based classes

### Step 3: ✅ **EXECUTE-HERE** — Create PageHeader Layout Primitive
**Status**: Pending
- Create `apps/web/src/components/layout/PageHeader.tsx`
- Use design tokens for styling
- Support breadcrumbs, actions, title/subtitle

### Step 4: ✅ **EXECUTE-HERE** — Scaffold /dashboard Page
**Status**: Pending
- Update `apps/web/app/dashboard/page.tsx` to use AppShell
- Integrate with PageHeader
- Use token-based styling

### Step 5: ✅ **EXECUTE-HERE** — Scaffold /deals List Page
**Status**: Pending
- Create `apps/web/app/deals/page.tsx`
- Use AppShell + PageHeader
- Basic deals list UI (no data fetching yet)

### Step 6: ✅ **EXECUTE-HERE** — Scaffold /deals/[id] Detail Page
**Status**: Pending
- Create `apps/web/app/deals/[id]/page.tsx`
- Use AppShell + PageHeader
- Basic deal detail UI shell

### Step 7: ✅ **EXECUTE-HERE** — Create ProfitCalculator UI Shell
**Status**: Pending
- Create `apps/web/src/components/ProfitCalculator.tsx`
- Basic form inputs and display (no heavy logic)
- Use design tokens

### Step 8: ⚠️ **DELEGATE-TO-AGENT** — Generate Test & Validation Prompts
**Status**: Pending
- UI Layout Auditor prompt
- UI Component Test Generator prompt

---

## 🚀 Execution Begins

Starting with Steps 2-3: Layout component updates and PageHeader creation.
