import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@magnus-flipper-ai/ui/components";
import { Card } from "@magnus-flipper-ai/ui/components";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface DealDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Deal Detail Page - View individual deal details
 * Uses AppShell layout and design tokens
 * Fetches real data from API
 */
export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const { id } = await params;

  return (
    <AppShell>
      <Suspense fallback={<DealDetailSkeleton />}>
        <DealDetailContent id={id} />
      </Suspense>
    </AppShell>
  );
}

async function DealDetailContent({ id }: { id: string }) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/deals/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error("Failed to fetch deal");
    }

    const { deal } = await response.json();

    return (
      <>
        <PageHeader
          title={deal.title || "Deal Details"}
          subtitle={`Deal #${deal.id} • ${deal.marketplace || "Unknown"}`}
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Deals", href: "/deals" },
            { label: deal.title || "Deal" },
          ]}
          actions={
            <div className="flex gap-3">
              <Button variant="secondary">Edit</Button>
              <Button variant="default">Mark as Sold</Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deal Info */}
            <Card className="p-6">
              <h2 className="text-h3 font-heading font-semibold text-foreground mb-4">
                Deal Information
              </h2>
              <div className="space-y-4">
                {deal.description && (
                  <div>
                    <label className="text-body-s text-text-secondary mb-1 block">
                      Description
                    </label>
                    <p className="text-body-m text-foreground">{deal.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-body-s text-text-secondary mb-1 block">
                      Marketplace
                    </label>
                    <p className="text-body-m text-foreground">{deal.marketplace || "—"}</p>
                  </div>
                  <div>
                    <label className="text-body-s text-text-secondary mb-1 block">Status</label>
                    <span className="inline-block px-2 py-1 rounded-md text-body-s bg-success/20 text-success">
                      {deal.status || "active"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Links */}
            {deal.buyUrl && (
              <Card className="p-6">
                <h2 className="text-h3 font-heading font-semibold text-foreground mb-4">Links</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-body-s text-text-secondary mb-1 block">Buy Link</label>
                    <a
                      href={deal.buyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body-m text-primary hover:underline"
                    >
                      {deal.buyUrl}
                    </a>
                  </div>
                  {deal.sellUrl && (
                    <div>
                      <label className="text-body-s text-text-secondary mb-1 block">
                        Sell Link
                      </label>
                      <a
                        href={deal.sellUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-body-m text-primary hover:underline"
                      >
                        {deal.sellUrl}
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <Card className="p-6">
              <h2 className="text-h3 font-heading font-semibold text-foreground mb-4">
                Financial Summary
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-body-m text-text-secondary">Buy Price</span>
                  <span className="text-body-m font-semibold text-foreground">
                    £{deal.buyPrice?.toFixed(2) || "0.00"}
                  </span>
                </div>
                {deal.sellPrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-body-m text-text-secondary">Sell Price</span>
                    <span className="text-body-m font-semibold text-foreground">
                      £{deal.sellPrice.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-body-m font-semibold text-foreground">Profit</span>
                    <span className="text-h3 font-bold text-success">
                      £{deal.profit?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  {deal.margin && (
                    <div className="flex justify-between items-center">
                      <span className="text-body-s text-text-secondary">Margin</span>
                      <span className="text-body-m font-semibold text-success">
                        {deal.margin.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Metadata */}
            <Card className="p-6">
              <h2 className="text-h3 font-heading font-semibold text-foreground mb-4">Metadata</h2>
              <div className="space-y-3">
                {deal.createdAt && (
                  <div>
                    <label className="text-body-s text-text-secondary mb-1 block">Created</label>
                    <p className="text-body-m text-foreground">
                      {new Date(deal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {deal.updatedAt && (
                  <div>
                    <label className="text-body-s text-text-secondary mb-1 block">
                      Last Updated
                    </label>
                    <p className="text-body-m text-foreground">
                      {new Date(deal.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {deal.score && (
                  <div>
                    <label className="text-body-s text-text-secondary mb-1 block">Score</label>
                    <p className="text-body-m text-foreground">{deal.score.toFixed(2)}</p>
                  </div>
                )}
                {deal.confidence && (
                  <div>
                    <label className="text-body-s text-text-secondary mb-1 block">
                      Confidence
                    </label>
                    <p className="text-body-m text-foreground">
                      {(deal.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error("Error loading deal:", error);
    return <DealDetailError />;
  }
}

function DealDetailSkeleton() {
  return (
    <>
      <div className="mb-8 animate-pulse">
        <div className="h-8 bg-surfaceSubtle rounded w-64 mb-2"></div>
        <div className="h-4 bg-surfaceSubtle rounded w-96"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 animate-pulse">
            <div className="h-6 bg-surfaceSubtle rounded w-48 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-surfaceSubtle rounded"></div>
              <div className="h-4 bg-surfaceSubtle rounded w-3/4"></div>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6 animate-pulse">
            <div className="h-6 bg-surfaceSubtle rounded w-40 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-surfaceSubtle rounded"></div>
              <div className="h-4 bg-surfaceSubtle rounded"></div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function DealDetailError() {
  return (
    <Card className="p-6">
      <div className="text-center py-12">
        <p className="text-body-m text-text-secondary mb-4">
          Failed to load deal details. Please try again later.
        </p>
        <Button variant="default" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    </Card>
  );
}
