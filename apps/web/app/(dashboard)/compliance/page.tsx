import { AppShell } from "@/src/components/layout/AppShell";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Suspense } from "react";
import { ComplianceDashboard } from "@/src/components/compliance/ComplianceDashboard";
import { Card } from "@magnus-flipper-ai/ui/components/Card";

/**
 * Compliance Page - Main compliance monitoring dashboard
 * Uses AppShell layout and design tokens
 */
export default function CompliancePage() {
  return (
    <AppShell>
      <PageHeader
        title="Compliance Shield"
        subtitle="Monitor marketplace risk scores, guardrails, and compliance metrics"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Compliance" },
        ]}
      />

      <Suspense fallback={<ComplianceSkeleton />}>
        <ComplianceDashboard />
      </Suspense>
    </AppShell>
  );
}

function ComplianceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-surfaceSubtle rounded w-24 mb-2"></div>
            <div className="h-8 bg-surfaceSubtle rounded w-16"></div>
          </Card>
        ))}
      </div>
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-surfaceSubtle rounded w-48 mb-4"></div>
        <div className="h-64 bg-surfaceSubtle rounded"></div>
      </Card>
    </div>
  );
}
