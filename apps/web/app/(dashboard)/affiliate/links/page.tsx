import { AppShell } from "@/src/components/layout/AppShell";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Card } from "@magnus-flipper-ai/ui/components/Card";
import { Button } from "@magnus-flipper-ai/ui/components/Button";
import { Suspense } from "react";
import { AffiliateLinksContent } from "./components/AffiliateLinksContent";

/**
 * Affiliate Links Page - Manage affiliate links
 * Uses AppShell layout and design tokens
 * Fetches real data from API
 */
export default function AffiliateLinksPage() {
  return (
    <AppShell>
      <PageHeader
        title="Affiliate Links"
        subtitle="Create and manage your affiliate links"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Affiliate", href: "/dashboard/affiliate" },
          { label: "Links" },
        ]}
        actions={
          <Button variant="default">Create New Link</Button>
        }
      />

      <Suspense fallback={<AffiliateLinksSkeleton />}>
        <AffiliateLinksContent />
      </Suspense>
    </AppShell>
  );
}

function AffiliateLinksSkeleton() {
  return (
    <Card className="p-6">
      <div className="animate-pulse">
        <div className="h-12 bg-surfaceSubtle rounded mb-4"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-surfaceSubtle rounded mb-2"></div>
        ))}
      </div>
    </Card>
  );
}
