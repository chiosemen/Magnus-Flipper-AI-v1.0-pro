import { AppShell } from "@/src/components/layout/AppShell";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Suspense } from "react";
import { ScraperPerformanceDashboard } from "@/src/components/scraper/ScraperPerformanceDashboard";
import { Card } from "@magnus-flipper-ai/ui/components/Card";

/**
 * Scraper Performance Page - Main scraper performance monitoring dashboard
 * Uses AppShell layout and design tokens
 */
export default function ScraperPerformancePage() {
  return (
    <AppShell>
      <PageHeader
        title="Scraper Performance"
        subtitle="Monitor scraper metrics, velocity ranking, and fingerprint statistics"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Scraper Performance" },
        ]}
      />

      <Suspense fallback={<ScraperSkeleton />}>
        <ScraperPerformanceDashboard />
      </Suspense>
    </AppShell>
  );
}

function ScraperSkeleton() {
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
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6 animate-pulse">
          <div className="h-6 bg-surfaceSubtle rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-surfaceSubtle rounded"></div>
        </Card>
      ))}
    </div>
  );
}
