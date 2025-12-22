import { getUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SystemStatusBar } from '@/components/admin/SystemStatusBar';
import { LiveMarketTape } from '@/components/admin/LiveMarketTape';
import { MarketplaceHealthGrid } from '@/components/admin/MarketplaceHealthGrid';
import { ScraperControlPanel } from '@/components/admin/ScraperControlPanel';
import { EconomicsSnapshot } from '@/components/admin/EconomicsSnapshot';
import { AuditLog } from '@/components/admin/AuditLog';

// Force dynamic rendering - no static optimization for admin routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  // Check authentication
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  // Check admin role
  const userRole = user.app_metadata?.role as string | undefined;
  const isAdmin = userRole === 'admin';

  return (
    <div className="min-h-screen bg-background">
      {/* System Status Bar - Always visible at top */}
      <SystemStatusBar isAdmin={isAdmin} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Show disabled state for non-admins (Never-Disappear Contract) */}
        {!isAdmin && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <div className="mx-auto max-w-md space-y-4">
              <div className="text-4xl">🔒</div>
              <h2 className="text-2xl font-semibold text-foreground">
                Admin Access Required
              </h2>
              <p className="text-muted-foreground">
                This control room is only accessible to administrators.
                Your account does not have the required permissions.
              </p>
              <div className="pt-4">
                <a
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Return to Dashboard
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Admin Grid - Only show controls when authorized */}
        {isAdmin && (
          <>
            {/* Market Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Live Market Tape - Left column, tall */}
              <div className="lg:col-span-1 lg:row-span-2">
                <LiveMarketTape entries={[]} />
              </div>

              {/* Marketplace Health Grid - Right column */}
              <div className="lg:col-span-2">
                <MarketplaceHealthGrid marketplaces={[]} />
              </div>

              {/* Economics Snapshot - Right column, below health */}
              <div className="lg:col-span-2">
                <EconomicsSnapshot
                  listingsToday={0}
                  searchesCreated={0}
                  estimatedMargin={0}
                  coveragePercent={0}
                />
              </div>
            </div>

            {/* Scraper Control Panel */}
            <ScraperControlPanel
              globalEnabled={false}
              marketplaces={[]}
              rateMultiplier={1.0}
            />

            {/* Audit Log - Collapsed by default */}
            <AuditLog entries={[]} />
          </>
        )}
      </div>
    </div>
  );
}
