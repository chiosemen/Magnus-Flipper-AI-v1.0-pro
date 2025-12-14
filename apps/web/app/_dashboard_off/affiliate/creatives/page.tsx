import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@magnus-flipper-ai/ui/components";
import { Suspense } from "react";
import { AffiliateCreativesContent } from "./components/AffiliateCreativesContent";

/**
 * Affiliate Creatives Page - Manage banners and promotional materials
 * Uses AppShell layout and design tokens
 * Fetches real data from API
 */
export default function AffiliateCreativesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Creatives"
        subtitle="Manage banners and promotional materials"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Affiliate", href: "/dashboard/affiliate" },
          { label: "Creatives" },
        ]}
        actions={
          <Button variant="default">Create Creative</Button>
        }
      />

      <Suspense fallback={<AffiliateCreativesSkeleton />}>
        <AffiliateCreativesContent />
      </Suspense>
    </AppShell>
  );
}

function AffiliateCreativesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-64 bg-surfaceSubtle rounded animate-pulse"></div>
      ))}
    </div>
  );
}
