import { AppShell } from "@/src/components/layout/AppShell";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Card } from "@magnus-flipper-ai/ui/components/Card";
import { Button } from "@magnus-flipper-ai/ui/components/Button";
import Link from "next/link";
import { Suspense } from "react";
import { DealsTable } from "./components/DealsTable";

/**
 * Deals List Page - Browse all deals
 * Uses AppShell layout and design tokens
 * Fetches real data from API
 */
export default function DealsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Deals"
        subtitle="Browse and manage your arbitrage opportunities"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Deals" },
        ]}
        actions={
          <Button variant="default">Add Deal</Button>
        }
      />

      <Suspense fallback={<DealsSkeleton />}>
        <DealsContent />
      </Suspense>
    </AppShell>
  );
}

async function DealsContent() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/deals?limit=50`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch deals");
    }

    const { deals } = await response.json();

    return <DealsTable deals={deals || []} />;
  } catch (error) {
    console.error("Error loading deals:", error);
    return <DealsError />;
  }
}

function DealsSkeleton() {
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

function DealsError() {
  return (
    <Card className="p-6">
      <div className="text-center py-12">
        <p className="text-body-m text-text-secondary mb-4">
          Failed to load deals. Please try again later.
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
