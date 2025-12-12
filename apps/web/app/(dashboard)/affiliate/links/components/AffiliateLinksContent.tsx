"use client";

import { Card } from "@magnus-flipper-ai/ui/components/Card";
import { Button } from "@magnus-flipper-ai/ui/components/Button";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { AffiliateLinkTable } from "../../../components/AffiliateLinkTable";
import { MetricsSummaryBar } from "../../../components/MetricsSummaryBar";

/**
 * Affiliate Links Content - Client component that fetches and displays links
 */
export function AffiliateLinksContent() {
  const { data, isLoading, error } = useAffiliateLinks();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-12 bg-surfaceSubtle rounded mb-4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-surfaceSubtle rounded mb-2"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-body-m text-text-secondary mb-4">
            Failed to load affiliate links. Please try again later.
          </p>
          <Button variant="default" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const links = data?.links || [];
  const metrics = data?.metrics || {
    totalClicks: { label: "Total Clicks", value: "0" },
    conversionRate: { label: "Conversion Rate", value: "0%" },
  };

  const displayMetrics = [
    metrics.totalClicks,
    metrics.conversionRate,
    { label: "Total Links", value: links.length.toString() },
    {
      label: "Active Links",
      value: links.filter((l: any) => l.status === "active").length.toString(),
    },
  ];

  return (
    <>
      {/* Metrics Summary */}
      <MetricsSummaryBar metrics={displayMetrics} />

      {/* Links Table */}
      <AffiliateLinkTable
        links={links}
        onCopy={(url) => {
          navigator.clipboard.writeText(url);
          // TODO: Show toast notification
        }}
        onEdit={(id) => {
          // TODO: Open edit modal
          console.log("Edit link:", id);
        }}
        onToggleStatus={(id) => {
          // TODO: Update link status via API
          console.log("Toggle status:", id);
        }}
      />
    </>
  );
}
