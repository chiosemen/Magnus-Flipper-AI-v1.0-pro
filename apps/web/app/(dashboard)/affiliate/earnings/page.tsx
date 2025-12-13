import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@magnus-flipper-ai/ui/components";
import { Suspense } from "react";
import { AffiliateEarningsContent } from "./components/AffiliateEarningsContent";

/**
 * Affiliate Earnings Page - View earnings and performance
 * Uses AppShell layout and design tokens
 * Fetches real data from API
 */
export default function AffiliateEarningsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Earnings"
        subtitle="Track your affiliate earnings and performance"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Affiliate", href: "/dashboard/affiliate" },
          { label: "Earnings" },
        ]}
        actions={
          <Button variant="secondary">Export Report</Button>
        }
      />

      <Suspense fallback={<AffiliateEarningsSkeleton />}>
        <AffiliateEarningsContent />
      </Suspense>
    </AppShell>
  );
}

function AffiliateEarningsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-surfaceSubtle rounded animate-pulse"></div>
        ))}
      </div>
      <div className="h-64 bg-surfaceSubtle rounded animate-pulse"></div>
    </>
  );
}
