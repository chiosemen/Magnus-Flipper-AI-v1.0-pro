import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@magnus-flipper-ai/ui/components";
import { Card } from "@magnus-flipper-ai/ui/components";
import { Suspense } from "react";
import { DashboardStats } from "./components/DashboardStats";
import { MarketplaceStatus } from "./components/MarketplaceStatus";

/**
 * Dashboard Page - Main dashboard view
 * Uses AppShell layout and design tokens
 * Fetches real data from API
 */
export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        subtitle="Track your deals, ROI, and marketplace activity"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Dashboard" },
        ]}
        actions={
          <Button variant="default">New Deal</Button>
        }
      />

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </AppShell>
  );
}

async function DashboardContent() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/dashboard/stats`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard stats");
    }

    const { stats, marketplaces } = await response.json();

    return (
      <>
        {/* Stats Grid */}
        <DashboardStats stats={stats} />

        {/* Marketplace Status */}
        <MarketplaceStatus marketplaces={marketplaces} />

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-h3 font-heading font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">View All Deals</Button>
            <Button variant="secondary">Run Profit Calculator</Button>
            <Button variant="secondary">View Analytics</Button>
          </div>
        </Card>
      </>
    );
  } catch (error) {
    console.error("Error loading dashboard:", error);
    return <DashboardError />;
  }
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-surfaceSubtle rounded w-24 mb-2"></div>
            <div className="h-8 bg-surfaceSubtle rounded w-16"></div>
          </Card>
        ))}
      </div>
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-surfaceSubtle rounded w-48 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 bg-surfaceSubtle rounded"></div>
          ))}
        </div>
      </Card>
    </>
  );
}

function DashboardError() {
  return (
    <Card className="p-6">
      <div className="text-center py-12">
        <p className="text-body-m text-text-secondary mb-4">
          Failed to load dashboard data. Please try again later.
        </p>
        <Button
          variant="default"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    </Card>
  );
}
