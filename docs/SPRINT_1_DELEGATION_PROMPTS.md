# Sprint 1 — Delegation Prompts for Specialized Agents

## 🎯 Step 8: Test & Validation

**Status**: ✅ Data Integration Complete — Ready for Testing

All pages now fetch real data from Supabase via API routes. Use these prompts to validate and test.

---

### DELEGATE-TO-AGENT: UI Layout Auditor

**Agent**: Magnus UI Layout Auditor  
**Prompt to paste**:

```
Audit UI Layout for Sprint 1 Frontend Pass

Validate the following components against design tokens and architecture:

1. Layout Components:
   - apps/web/src/components/layout/AppShell.tsx
   - apps/web/src/components/layout/Sidebar.tsx
   - apps/web/src/components/layout/TopNav.tsx
   - apps/web/src/components/layout/PageHeader.tsx

2. Pages:
   - apps/web/app/dashboard/page.tsx
   - apps/web/app/deals/page.tsx
   - apps/web/app/deals/[id]/page.tsx

3. Components:
   - apps/web/src/components/ProfitCalculator.tsx

Check for:
- Token usage consistency (colors, spacing, radius, typography)
- Hardcoded values that should use tokens
- Layout hierarchy compliance
- Responsive breakpoint usage
- Dark mode support

Generate a detailed audit report with:
- Violations found
- Suggested fixes with file paths
- Risk levels (critical, warning, info)
```

---

### DELEGATE-TO-AGENT: UI Component Test Generator

**Agent**: Magnus UI Component Test Generator  
**Prompt to paste**:

```
Generate tests for Sprint 1 Frontend Pass components

Create Jest/Vitest + React Testing Library tests for:

1. Layout Components:
   - AppShell (apps/web/src/components/layout/AppShell.tsx)
   - Sidebar (apps/web/src/components/layout/Sidebar.tsx)
   - TopNav (apps/web/src/components/layout/TopNav.tsx)
   - PageHeader (apps/web/src/components/layout/PageHeader.tsx)

2. Pages:
   - Dashboard page (apps/web/app/dashboard/page.tsx)
   - Deals list page (apps/web/app/deals/page.tsx)
   - Deal detail page (apps/web/app/deals/[id]/page.tsx)

3. Components:
   - ProfitCalculator (apps/web/src/components/ProfitCalculator.tsx)
   - DashboardStats (apps/web/app/dashboard/components/DashboardStats.tsx)
   - MarketplaceStatus (apps/web/app/dashboard/components/MarketplaceStatus.tsx)
   - DealsTable (apps/web/app/deals/components/DealsTable.tsx)

4. API Routes:
   - /api/deals (apps/web/app/api/deals/route.ts)
   - /api/deals/[id] (apps/web/app/api/deals/[id]/route.ts)
   - /api/dashboard/stats (apps/web/app/api/dashboard/stats/route.ts)

Test coverage should include:
- Rendering and basic structure
- Variant support (if applicable)
- Dark mode rendering
- Accessibility (ARIA labels, roles)
- User interactions (clicks, navigation)
- Responsive behavior

Use design tokens from packages/ui/theme/tokens.ts for test assertions.
Place tests in apps/web/__tests__/ following the same directory structure.
```

---

### DELEGATE-TO-AGENT: Component Contract Enforcer

**Agent**: Magnus Component Contract Enforcer  
**Prompt to paste**:

```
Enforce component contracts for Sprint 1 components

Compare web components with mobile equivalents (if they exist):

1. Layout Components:
   - AppShell (web) vs mobile equivalent
   - Sidebar (web) vs mobile navigation
   - PageHeader (web) vs mobile header

2. UI Components:
   - Card, Button, Input from packages/ui/components
   - Ensure web/mobile API parity

Generate:
- Contract definitions in packages/core/ui-contracts/
- Mismatch reports
- Suggested fixes for API consistency

Focus on:
- Prop naming consistency
- Variant support parity
- Event handler signatures
- Accessibility props
```

---

## 📋 Usage Instructions

1. **Open the specified agent** in Cursor (e.g., "Magnus UI Layout Auditor")
2. **Paste the prompt** exactly as shown above
3. **Review the output** and apply suggested fixes
4. **Update Sprint 1 status** based on audit/test results

---

## ✅ Expected Outcomes

- **Layout Auditor**: Detailed report with token violations and fixes
- **Test Generator**: Complete test suite with good coverage
- **Contract Enforcer**: API consistency report and contract definitions
