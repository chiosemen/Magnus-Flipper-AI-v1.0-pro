"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Suspense } from "react";

import { MarketplaceRiskTable } from "@/components/compliance/MarketplaceRiskTable";
import { useComplianceRisk } from "@/hooks/useComplianceRisk";
import { Card } from "@magnus-flipper-ai/ui/components";

/**
 * Compliance Marketplaces Page - Detailed marketplace risk view
 * Uses AppShell layout and design tokens
 */
export default function ComplianceMarketplacesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Marketplace Risk Analysis"
        subtitle="Detailed risk scores and compliance levels for all marketplaces"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Compliance", href: "/dashboard/compliance" },
          { label: "Marketplaces" },
        ]}
      />

      <MarketplacesContent />
    </AppShell>
  );
}

function MarketplacesContent() {
  const { data, isLoading } = useComplianceRisk();

  if (isLoading) {
    return <MarketplacesSkeleton />;
  }

  if (!data?.marketplaceRisks || data.marketplaceRisks.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-body-m text-text-secondary">No marketplace risk data available</p>
        </div>
      </Card>
    );
  }

  return <MarketplaceRiskTable risks={data.marketplaceRisks} />;
}

function MarketplacesSkeleton() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="h-6 bg-surfaceSubtle rounded w-48 mb-4"></div>
      <div className="h-64 bg-surfaceSubtle rounded"></div>
    </Card>
  );
}
