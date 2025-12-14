"use client";

import { Button } from "@magnus-flipper-ai/ui/components";
import { Card } from "@magnus-flipper-ai/ui/components";
import Link from "next/link";
import { useAffiliateOverview } from "@/hooks/useAffiliateOverview";

/**
 * Affiliate Overview Content - Fetches and displays overview data
 */
export function AffiliateOverviewContent() {
  const { data, isLoading, error } = useAffiliateOverview();

  if (isLoading) {
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
      </>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-body-m text-text-secondary mb-4">
            Failed to load affiliate data. Please try again later.
          </p>
          <Button variant="default" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const overview = data;

  return (
    <>
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="text-text-secondary text-sm mb-1">Total Earnings</div>
          <div className="text-h2 font-bold text-success">
${overview?.metrics?.totalEarnings?.value || "0.00"}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-text-secondary text-sm mb-1">Total Clicks</div>
          <div className="text-h2 font-bold text-foreground">
{overview?.metrics?.totalClicks?.value || "0"}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-text-secondary text-sm mb-1">Conversion Rate</div>
          <div className="text-h2 font-bold text-primary">
{overview?.metrics?.conversionRate?.value || "0.00"}%
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-text-secondary text-sm mb-1">Active Links</div>
          <div className="text-h2 font-bold text-foreground">
            {overview?.metrics?.activeLinks || 0} / {overview?.metrics?.totalLinks || 0}
          </div>
        </Card>
      </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-h4 font-heading font-semibold text-foreground mb-2">
              Manage Links
            </h3>
            <p className="text-body-m text-text-secondary mb-4">
              Create and manage your affiliate links
            </p>
            <Button variant="default" className="w-full" asChild>
              <Link href="/dashboard/affiliate/links">Go to Links</Link>
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-h4 font-heading font-semibold text-foreground mb-2">
              View Earnings
            </h3>
            <p className="text-body-m text-text-secondary mb-4">
              Track your earnings and performance
            </p>
            <Button variant="default" className="w-full" asChild>
              <Link href="/dashboard/affiliate/earnings">View Earnings</Link>
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-h4 font-heading font-semibold text-foreground mb-2">
              Creatives
            </h3>
            <p className="text-body-m text-text-secondary mb-4">
              Manage banners and promotional materials
            </p>
            <Button variant="default" className="w-full" asChild>
              <Link href="/dashboard/affiliate/creatives">Manage Creatives</Link>
            </Button>
          </Card>
        </div>

      {/* Recent Activity */}
      {overview?.recentLinks && overview.recentLinks.length > 0 && (
        <Card className="p-6">
          <h3 className="text-h4 font-heading font-semibold text-foreground mb-4">
            Recent Links
          </h3>
          <div className="space-y-3">
            {overview.recentLinks.slice(0, 5).map((link: any) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 bg-surfaceSubtle rounded-md"
              >
                <div className="flex-1">
                  <div className="text-body-m font-medium text-foreground">{link.name}</div>
                  <div className="text-body-s text-text-secondary">{link.clicks} clicks</div>
                </div>
                <div className="text-body-m font-semibold text-success">
                  ${link.revenue?.toFixed(2) || "0.00"}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="secondary" className="w-full" asChild>
              <Link href="/dashboard/affiliate/links">View All Links</Link>
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
