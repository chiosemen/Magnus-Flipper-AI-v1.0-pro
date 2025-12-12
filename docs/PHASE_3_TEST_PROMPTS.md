# Phase 3 — Test Generation Prompts

## 🎯 Delegation Prompts for Testing Agents

---

### DELEGATE-TO-AGENT: UI Component Test Generator

**Agent**: Magnus UI Component Test Generator  
**Prompt to paste**:

```
Generate tests for Phase 3 Affiliate Portal components

Create Jest/Vitest + React Testing Library tests for:

1. Affiliate Pages:
   - AffiliateOverview (apps/web/app/(dashboard)/affiliate/page.tsx)
   - AffiliateLinks (apps/web/app/(dashboard)/affiliate/links/page.tsx)
   - AffiliateEarnings (apps/web/app/(dashboard)/affiliate/earnings/page.tsx)
   - AffiliateCreatives (apps/web/app/(dashboard)/affiliate/creatives/page.tsx)

2. Affiliate Components:
   - AffiliateOverviewContent (apps/web/app/(dashboard)/affiliate/components/AffiliateOverviewContent.tsx)
   - AffiliateQuickStats (apps/web/app/(dashboard)/affiliate/components/AffiliateQuickStats.tsx)
   - AffiliateLinkTable (apps/web/app/(dashboard)/affiliate/components/AffiliateLinkTable.tsx)
   - MetricsSummaryBar (apps/web/app/(dashboard)/affiliate/components/MetricsSummaryBar.tsx)
   - EarningsChart (apps/web/app/(dashboard)/affiliate/components/EarningsChart.tsx)
   - CreativesGrid (apps/web/app/(dashboard)/affiliate/components/CreativesGrid.tsx)

3. API Hooks:
   - useAffiliateOverview (apps/web/src/hooks/useAffiliateOverview.ts)
   - useAffiliateLinks (apps/web/src/hooks/useAffiliateLinks.ts)
   - useAffiliateEarnings (apps/web/src/hooks/useAffiliateEarnings.ts)

4. API Routes:
   - /api/affiliate/overview (apps/web/app/api/affiliate/overview/route.ts)
   - /api/affiliate/links (apps/web/app/api/affiliate/links/route.ts)
   - /api/affiliate/earnings (apps/web/app/api/affiliate/earnings/route.ts)

Test coverage should include:
- Rendering and basic structure
- Data fetching and loading states
- Error handling
- User interactions (clicks, filters, period changes)
- Empty states
- Responsive behavior
- Design token usage assertions

Use design tokens from packages/ui/theme/tokens.ts for test assertions.
Place tests in apps/web/__tests__/ following the same directory structure.
```

---

### DELEGATE-TO-AGENT: UI Layout Auditor

**Agent**: Magnus UI Layout Auditor  
**Prompt to paste**:

```
Audit UI Layout for Phase 3 Affiliate Portal

Validate the following affiliate components against design tokens and architecture:

1. Affiliate Pages:
   - apps/web/app/(dashboard)/affiliate/page.tsx
   - apps/web/app/(dashboard)/affiliate/links/page.tsx
   - apps/web/app/(dashboard)/affiliate/earnings/page.tsx
   - apps/web/app/(dashboard)/affiliate/creatives/page.tsx

2. Affiliate Components:
   - apps/web/app/(dashboard)/affiliate/components/AffiliateOverviewContent.tsx
   - apps/web/app/(dashboard)/affiliate/components/AffiliateQuickStats.tsx
   - apps/web/app/(dashboard)/affiliate/components/AffiliateLinkTable.tsx
   - apps/web/app/(dashboard)/affiliate/components/MetricsSummaryBar.tsx
   - apps/web/app/(dashboard)/affiliate/components/EarningsChart.tsx
   - apps/web/app/(dashboard)/affiliate/components/CreativesGrid.tsx

Check for:
- Token usage consistency (colors, spacing, radius, typography)
- Hardcoded values that should use tokens
- Layout hierarchy compliance (AppShell + PageHeader pattern)
- Responsive breakpoint usage
- Dark mode support
- Consistent component structure

Generate a detailed audit report with:
- Violations found
- Suggested fixes with file paths
- Risk levels (critical, warning, info)
- Layout compliance score
```

---

## 📋 Usage Instructions

1. **Open the specified agent** in Cursor
2. **Paste the prompt** exactly as shown above
3. **Review the output** and apply suggested fixes
4. **Update Phase 3 status** based on test/audit results

---

## ✅ Expected Outcomes

- **Test Generator**: Comprehensive test suite with good coverage
- **Layout Auditor**: Detailed report with token violations and fixes

---

**Ready for testing and validation!** 🧪
