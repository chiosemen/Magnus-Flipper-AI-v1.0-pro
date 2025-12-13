import { AppShell } from "@/src/components/layout/AppShell";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Button } from "@magnus-flipper-ai/ui/components";
import { Card } from "@magnus-flipper-ai/ui/components";
import Link from "next/link";
import { Suspense } from "react";
import { AffiliateOverviewContent } from "./components/AffiliateOverviewContent";
import { AffiliateQuickStats } from "./components/AffiliateQuickStats";

/**
 * Affiliate Overview Page - Main affiliate dashboard
 * Uses AppShell layout and design tokens
 * Fetches real data from API
 */
export default function AffiliatePage() {
  return (
    <AppShell>
      <PageHeader
        title="Affiliate Portal"
        subtitle="Track your referrals, earnings, and performance"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Affiliate" },
        ]}
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" asChild>
              <Link href="/dashboard/affiliate/links">Manage Links</Link>
            </Button>
            <Button variant="default">Create Link</Button>
          </div>
        }
      />

      <Suspense fallback={<AffiliateOverviewSkeleton />}>
        <AffiliateOverviewContent />
      </Suspense>

      {/* Quick Stats */}
      <AffiliateQuickStats />
    </AppShell>
  );
}

function AffiliateOverviewSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-surfaceSubtle rounded w-24 mb-2"></div>
            <div className="h-8 bg-surfaceSubtle rounded w-32"></div>
          </Card>
        ))}
      </div>
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-surfaceSubtle rounded w-48 mb-4"></div>
        <div className="h-64 bg-surfaceSubtle rounded"></div>
      </Card>
    </>
  );
}
