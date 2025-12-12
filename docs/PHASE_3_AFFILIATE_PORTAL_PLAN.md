# Phase 3 — Affiliate Portal — Execution Plan

## 📋 Sprint Command

**Command**: Start Sprint Execution — Phase 3 (Affiliate Portal)  
**Goal**: Implement Affiliate Portal UI and flows  
**Status**: 🚀 **In Progress**

---

## 🎯 Phase 3 Objectives

- ✅ Affiliate dashboard overview
- ✅ Links/creatives management
- ✅ Earnings view with analytics
- ✅ Basic analytics widgets
- ✅ Integration with AppShell layout pattern

---

## 📋 Sprint Step Plan (8 Steps)

### Step 1: ✅ **EXECUTE-HERE** — Inspect & Plan
**Status**: Complete
- ✅ Inspected existing affiliate structure (`/dashboard/affiliate/`)
- ✅ Found existing pages: links, earnings, creatives
- ✅ Found existing components: AffiliateLinkTable, MetricsSummaryBar, EarningsChart, CreativesGrid
- ⚠️ Existing pages don't use AppShell + PageHeader pattern
- ⚠️ No main overview page (`/affiliate`)

### Step 2: ✅ **EXECUTE-HERE** — Create TypeScript Types
**Status**: In Progress
- Create affiliate data models in `packages/core/src/types/affiliate.ts`
- Define: AffiliateLink, AffiliateCreative, AffiliateEarning, AffiliateMetrics
- Export from packages/core

### Step 3: ✅ **EXECUTE-HERE** — Create Main Overview Page
**Status**: Pending
- Create `apps/web/app/(dashboard)/affiliate/page.tsx`
- Use AppShell + PageHeader pattern
- Display overview metrics and quick actions

### Step 4: ✅ **EXECUTE-HERE** — Update Existing Routes to AppShell Pattern
**Status**: Pending
- Update `/dashboard/affiliate/links/page.tsx` to use AppShell + PageHeader
- Update `/dashboard/affiliate/earnings/page.tsx` to use AppShell + PageHeader
- Update `/dashboard/affiliate/creatives/page.tsx` to use AppShell + PageHeader
- Update `/dashboard/affiliate/layout.tsx` to work within AppShell

### Step 5: ✅ **EXECUTE-HERE** — Create API Hooks
**Status**: Pending
- Create `apps/web/src/hooks/useAffiliateOverview.ts`
- Create `apps/web/src/hooks/useAffiliateLinks.ts`
- Create `apps/web/src/hooks/useAffiliateEarnings.ts`
- Use React Query for data fetching

### Step 6: ✅ **EXECUTE-HERE** — Create API Routes
**Status**: Pending
- Create `apps/web/app/api/affiliate/overview/route.ts`
- Create `apps/web/app/api/affiliate/links/route.ts`
- Create `apps/web/app/api/affiliate/earnings/route.ts`

### Step 7: ⚠️ **DELEGATE-TO-AGENT** — Generate Screen Blueprints
**Status**: Pending
- Generate prompts for Screen Blueprint Generator
- AffiliateOverview screen
- AffiliateLinks screen (enhancement)
- AffiliateEarnings screen (enhancement)

### Step 8: ⚠️ **DELEGATE-TO-AGENT** — Generate Test Prompts
**Status**: Pending
- UI Component Test Generator prompts
- Layout Auditor prompts

---

## 🚀 Execution Begins

Starting with Steps 2-6: Types, Overview Page, Route Updates, Hooks, and API Routes.
