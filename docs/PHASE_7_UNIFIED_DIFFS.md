# Phase 7 — Compliance Shield + Marketplace Risk System — Unified Diffs

## Core Package Enhancements

### 1. Risk Scoring System

```diff
--- /dev/null
+++ b/packages/compliance-shield/src/riskScoring.ts
@@ -0,0 +1,200 @@
+/**
+ * Risk Scoring System
+ * Calculates marketplace risk scores based on multiple factors
+ */
+
+import { MarketplaceProfile, RiskLevel, JsChallengeRisk } from '@magnus-flipper-ai/marketplace-config';
+
+export interface RiskScore {
+  overall: number; // 0-100, higher = more risky
+  factors: {
+    riskLevel: number;
+    jsChallengeRisk: number;
+    throttleBudget: number;
+    antiBotRequirements: number;
+    historicalBlockRate?: number;
+  };
+  recommendations: string[];
+  complianceLevel: 'safe' | 'caution' | 'high-risk' | 'critical';
+}
+
+/**
+ * Calculate overall risk score for a marketplace
+ */
+export function calculateRiskScore(
+  profile: MarketplaceProfile,
+  historicalBlockRate?: number
+): RiskScore {
+  // Weighted average calculation
+  // Returns risk score with recommendations
+}
+
+/**
+ * Compare risk scores between marketplaces
+ */
+export function compareRiskScores(
+  scores: Array<{ marketplace: string; score: RiskScore }>
+): Array<{ marketplace: string; score: RiskScore; rank: number }> {
+  // Sorts by risk score and assigns ranks
+}
```

### 2. Adaptive Throttling Guardrails

```diff
--- /dev/null
+++ b/packages/compliance-shield/src/guardrails.ts
@@ -0,0 +1,180 @@
+/**
+ * Adaptive Throttling Guardrails
+ * Safety limits and enforcement for adaptive throttling
+ */
+
+import { MarketplaceProfile } from '@magnus-flipper-ai/marketplace-config';
+
+export interface ThrottleGuardrail {
+  minMultiplier: number;
+  maxMultiplier: number;
+  emergencyThreshold: number;
+  emergencyMultiplier: number;
+  recoveryThreshold: number;
+  cooldownPeriod: number;
+}
+
+/**
+ * Default guardrails by risk level
+ */
+const DEFAULT_GUARDRAILS: Record<string, ThrottleGuardrail> = {
+  low: { minMultiplier: 0.5, maxMultiplier: 1.5, ... },
+  medium: { minMultiplier: 0.4, maxMultiplier: 1.3, ... },
+  high: { minMultiplier: 0.3, maxMultiplier: 1.2, ... },
+  critical: { minMultiplier: 0.2, maxMultiplier: 1.1, ... },
+};
+
+/**
+ * Apply guardrails to throttle multiplier
+ */
+export function applyGuardrails(
+  profile: MarketplaceProfile,
+  proposedMultiplier: number,
+  successRate: number,
+  isEmergencyMode: boolean = false
+): {
+  multiplier: number;
+  violations: GuardrailViolation[];
+  emergencyMode: boolean;
+} {
+  // Enforces min/max bounds, emergency mode, recovery
+}
```

### 3. Enhanced Compliance Shield

```diff
--- a/packages/compliance-shield/src/index.ts
+++ b/packages/compliance-shield/src/index.ts
@@ -1,6 +1,12 @@
 /**
- * Compliance Shield - Anti-Bot Evasion & Request Fingerprinting
+ * Compliance Shield v1.0 - Anti-Bot Evasion & Request Fingerprinting
+ * 
+ * Features:
+ * - Request fingerprinting
+ * - Compliance validation
+ * - Risk scoring
+ * - Adaptive throttling guardrails
  */
 
 import { MarketplaceProfile, MarketplaceId } from '@magnus-flipper-ai/marketplace-config';
+export * from './riskScoring';
+export * from './guardrails';
```

### 4. Rate Limiter Integration

```diff
--- a/packages/rate-limiter/src/index.ts
+++ b/packages/rate-limiter/src/index.ts
@@ -215,6 +215,30 @@ export async function getAdaptiveThrottleMultiplier(
   // If success rate is low (<70%), reduce rate
   else if (successRate < 0.7) {
     multiplier = Math.max(0.5, successRate);
   }
 
-  return 1.0;
+  // Apply guardrails (import dynamically to avoid circular deps)
+  try {
+    const guardrailsModule = await import('@magnus-flipper-ai/compliance-shield/guardrails');
+    const guardrails = guardrailsModule.getGuardrails(profile);
+    
+    // Check emergency threshold
+    if (successRate < guardrails.emergencyThreshold) {
+      await redis.set(`${baseKey}:emergency`, '1', 'EX', 3600);
+      return guardrails.emergencyMultiplier;
+    }
+    
+    // Check recovery threshold
+    if (emergencyRaw && successRate >= guardrails.recoveryThreshold) {
+      await redis.del(`${baseKey}:emergency`);
+    }
+    
+    // Apply min/max bounds
+    multiplier = Math.max(guardrails.minMultiplier, Math.min(guardrails.maxMultiplier, multiplier));
+    
+    return multiplier;
+  } catch (err) {
+    console.warn('[rate-limiter] Guardrails not available, using base multiplier:', err);
+    return multiplier;
+  }
 }
```

## Observability Panel Patches

### 5. Risk Scores API

```diff
--- /dev/null
+++ b/apps/canary-dashboard/app/api/compliance/risk-scores/route.ts
@@ -0,0 +1,50 @@
+import { NextResponse } from 'next/server';
+import { getMarketplaceProfile, MARKETPLACE_PROFILES } from '@magnus-flipper-ai/marketplace-config';
+import { calculateRiskScore, compareRiskScores } from '@magnus-flipper-ai/compliance-shield/riskScoring';
+
+export async function GET() {
+  const scores = Object.keys(MARKETPLACE_PROFILES).map((marketplaceId) => {
+    const profile = getMarketplaceProfile(marketplaceId);
+    const score = calculateRiskScore(profile);
+    return { marketplace: marketplaceId, score };
+  });
+
+  const ranked = compareRiskScores(scores);
+
+  return NextResponse.json({
+    marketplaces: ranked,
+    summary: { total, critical, highRisk, caution, safe },
+    timestamp: new Date().toISOString(),
+  });
+}
```

### 6. Guardrails API

```diff
--- /dev/null
+++ b/apps/canary-dashboard/app/api/compliance/guardrails/route.ts
@@ -0,0 +1,80 @@
+import { NextRequest, NextResponse } from 'next/server';
+import { getMarketplaceProfile } from '@magnus-flipper-ai/marketplace-config';
+import { getGuardrails, applyGuardrails } from '@magnus-flipper-ai/compliance-shield/guardrails';
+
+// GET /api/compliance/guardrails?marketplace=facebook
+export async function GET(request: NextRequest) {
+  const marketplace = request.nextUrl.searchParams.get('marketplace');
+  const profile = getMarketplaceProfile(marketplace);
+  const guardrails = getGuardrails(profile);
+  return NextResponse.json({ marketplace, guardrails, ... });
+}
+
+// POST /api/compliance/guardrails/validate
+export async function POST(request: NextRequest) {
+  const { marketplace, proposedMultiplier, successRate, isEmergencyMode } = await request.json();
+  const profile = getMarketplaceProfile(marketplace);
+  const result = applyGuardrails(profile, proposedMultiplier, successRate, isEmergencyMode);
+  return NextResponse.json({ marketplace, input: {...}, output: result });
+}
```

### 7. Compliance Panel Component

```diff
--- /dev/null
+++ b/apps/canary-dashboard/components/CompliancePanel.tsx
@@ -0,0 +1,150 @@
+'use client';
+
+import { useEffect, useState } from 'react';
+
+export function CompliancePanel() {
+  const [riskScores, setRiskScores] = useState<MarketplaceRisk[]>([]);
+  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
+
+  useEffect(() => {
+    fetchRiskScores();
+    const interval = setInterval(fetchRiskScores, 30000);
+    return () => clearInterval(interval);
+  }, []);
+
+  return (
+    <div className="bg-card rounded-lg border p-6">
+      <h3 className="text-lg font-semibold mb-4">🛡️ Compliance & Risk Scores</h3>
+      {/* Risk scores table with compliance levels */}
+    </div>
+  );
+}
```

### 8. Dashboard Integration

```diff
--- a/apps/canary-dashboard/app/page.tsx
+++ b/apps/canary-dashboard/app/page.tsx
@@ -3,6 +3,7 @@ import { StatusCard } from '@/components/StatusCard';
 import { RevisionCard } from '@/components/RevisionCard';
 import { Charts } from '@/components/Charts';
+import { CompliancePanel } from '@/components/CompliancePanel';
 import { useWebSocket } from '@/lib/socket';
 
@@ -72,6 +73,8 @@ export default function DashboardPage() {
           <StatusCard mlDecision={mlDecision || metrics?.ml} health={metrics?.health} />
         </div>
 
+        <CompliancePanel />
+
         <Charts metrics={metrics} />
```

---

## Summary

**Files Created:**
- `packages/compliance-shield/src/riskScoring.ts`
- `packages/compliance-shield/src/guardrails.ts`
- `apps/canary-dashboard/app/api/compliance/risk-scores/route.ts`
- `apps/canary-dashboard/app/api/compliance/guardrails/route.ts`
- `apps/canary-dashboard/components/CompliancePanel.tsx`

**Files Modified:**
- `packages/compliance-shield/src/index.ts`
- `packages/compliance-shield/package.json`
- `packages/rate-limiter/src/index.ts`
- `apps/canary-dashboard/app/page.tsx`
- `apps/worker-realtime/src/scheduler.ts`

**Status:** ✅ Phase 7 Complete
