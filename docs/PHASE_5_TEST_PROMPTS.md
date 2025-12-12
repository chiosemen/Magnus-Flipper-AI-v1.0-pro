# Phase 5 — Compliance Shield — Test Generation Prompts

## 🎯 Delegation Prompts for Testing Agents

---

### DELEGATE-TO-AGENT: UI Component Test Generator

**Agent**: Magnus UI Component Test Generator  
**Prompt to paste**:

```
Generate tests for Phase 5 Compliance Shield components

Create Jest/Vitest + React Testing Library tests for:

1. Compliance Pages:
   - CompliancePage (apps/web/app/(dashboard)/compliance/page.tsx)
   - ComplianceMarketplacesPage (apps/web/app/(dashboard)/compliance/marketplaces/page.tsx)

2. Compliance Components:
   - RiskScoreCard (apps/web/src/components/compliance/RiskScoreCard.tsx)
   - GuardrailsPanel (apps/web/src/components/compliance/GuardrailsPanel.tsx)
   - MarketplaceRiskTable (apps/web/src/components/compliance/MarketplaceRiskTable.tsx)
   - ComplianceDashboard (apps/web/src/components/compliance/ComplianceDashboard.tsx)

3. Compliance Hooks:
   - useComplianceRisk (apps/web/src/hooks/useComplianceRisk.ts)
   - useComplianceGuardrails (apps/web/src/hooks/useComplianceGuardrails.ts)
   - useComplianceMetrics (apps/web/src/hooks/useComplianceMetrics.ts)

4. API Routes:
   - /api/compliance/risk-scores (apps/web/app/api/compliance/risk-scores/route.ts)
   - /api/compliance/guardrails (apps/web/app/api/compliance/guardrails/route.ts)
   - /api/compliance/metrics (apps/web/app/api/compliance/metrics/route.ts)

Test coverage should include:
- Rendering and basic structure
- Data fetching and loading states
- Error handling
- Risk score calculations and display
- Guardrail validation
- Compliance level badges and colors
- Summary statistics
- Empty states
- Responsive behavior
- Design token usage assertions

Use design tokens from packages/ui/theme/tokens.ts for test assertions.
Place tests in apps/web/__tests__/ following the same directory structure.
```

---

### DELEGATE-TO-AGENT: Integration Tests

**Agent**: Magnus Test Generator  
**Prompt to paste**:

```
Generate integration tests for Phase 5 Compliance Shield

Test scenarios:

1. Compliance API Endpoints:
   - GET /api/compliance/risk-scores - Verify risk scores returned
   - GET /api/compliance/risk-scores?marketplace=facebook - Verify filtering
   - GET /api/compliance/guardrails - Verify guardrails returned
   - GET /api/compliance/guardrails?marketplace=facebook - Verify filtering
   - POST /api/compliance/guardrails/validate - Verify validation logic
   - GET /api/compliance/metrics - Verify metrics returned

2. Compliance Page Flow:
   - Navigate to /dashboard/compliance
   - Verify compliance dashboard loads
   - Verify summary cards display correct counts
   - Verify risk table displays marketplaces
   - Verify risk score cards display correctly
   - Navigate to /dashboard/compliance/marketplaces
   - Verify marketplace risk table displays

3. Risk Score Calculations:
   - Verify risk scores calculated correctly
   - Verify compliance levels assigned correctly
   - Verify recommendations generated
   - Verify marketplace ranking

4. Guardrail Validation:
   - Verify guardrails applied correctly
   - Verify violations detected
   - Verify emergency mode triggered
   - Verify multiplier clamping

Generate test files:
- tests/integration/compliance-api.test.ts
- tests/integration/compliance-pages.test.ts
- tests/integration/compliance-calculations.test.ts
```

---

## 📋 Usage Instructions

1. **Open the specified agent** in Cursor
2. **Paste the prompt** exactly as shown above
3. **Review the output** and apply suggested fixes
4. **Update Phase 5 status** based on test results

---

## ✅ Expected Outcomes

- **Test Generator**: Comprehensive test suite with good coverage
- **Integration Tests**: Full integration test suite

---

**Ready for testing and validation!** 🧪
