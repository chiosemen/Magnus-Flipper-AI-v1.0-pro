/**
 * Car Flipper Section - Production-Grade Example
 *
 * This example demonstrates the complete implementation of the Car Flipper section
 * using the Never-Disappear UI Contract + FeatureGate + SafeImage.
 *
 * Key principles:
 * 1. Section ALWAYS renders (never conditional on data)
 * 2. Feature flag controls behavior, not visibility
 * 3. All images use SafeImage with resolveImage
 * 4. All 4 states explicitly handled
 */

import { SectionShell, fromReactQuery } from "@/lib/ui-contracts";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  CarFlipperSkeleton,
  CarFlipperEmpty,
  CarFlipperError,
  CarFlipperDisabled,
} from "./CarFlipperStates";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, MapPin, Clock } from "lucide-react";

// Example type (replace with your actual type)
interface FlipOpportunity {
  id: string;
  title: string;
  imageUrl: string | null;
  listingPrice: number;
  marketValue: number;
  profitPotential: number;
  location: string;
  listedAt: string;
  marketplace: string;
}

// Example API call (replace with your actual API)
async function fetchFlipOpportunities(): Promise<FlipOpportunity[]> {
  const response = await fetch("/api/flip-opportunities");
  if (!response.ok) throw new Error("Failed to fetch flip opportunities");
  return response.json();
}

/**
 * Car Flipper Section Component
 */
export function CarFlipperSection() {
  // Check feature flag
  const isFeatureEnabled =
    process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_SHOW_CAR_FLIPPER === "true";

  // Fetch data
  const query = useQuery({
    queryKey: ["flip-opportunities"],
    queryFn: fetchFlipOpportunities,
    enabled: isFeatureEnabled, // Only fetch if feature is enabled
    refetchInterval: 60000, // Refresh every minute
  });

  // Convert to section state
  const sectionState = fromReactQuery(query);

  return (
    <FeatureGate feature="car-flipper" enabled={isFeatureEnabled}>
      {(isEnabled) =>
        isEnabled ? (
          <SectionShell
            sectionId="car-flipper"
            state={sectionState}
            renderLoading={() => <CarFlipperSkeleton />}
            renderEmpty={() => <CarFlipperEmpty />}
            renderError={(error) => <CarFlipperError error={error} onRetry={() => query.refetch()} />}
            renderReady={(deals) => <CarFlipperCards deals={deals} />}
          />
        ) : (
          <CarFlipperDisabled />
        )
      }
    </FeatureGate>
  );
}

/**
 * Car Flipper Cards - Ready State
 */
function CarFlipperCards({ deals }: { deals: FlipOpportunity[] }) {
  return (
    <div className="space-y-4" data-state="ready">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Active Flip Opportunities</h2>
        <span className="text-sm text-text-secondary">{deals.length} deals found</span>
      </div>

      {deals.map((deal) => (
        <Card key={deal.id} className="p-4 hover:border-primary/50 transition-colors">
          <div className="flex gap-4">
            {/* ✅ CORRECT: Using SafeImage with nullable imageUrl */}
            <div className="relative w-32 h-32 flex-shrink-0 rounded-md overflow-hidden">
              <SafeImage
                src={deal.imageUrl ?? '/images/placeholder.png'}
                alt={deal.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 space-y-2">
              {/* Title */}
              <h3 className="font-semibold text-lg">{deal.title}</h3>

              {/* Pricing */}
              <div className="flex gap-4 text-sm">
                <span className="text-text-secondary">
                  Listing: <strong className="text-text-primary">${deal.listingPrice.toLocaleString()}</strong>
                </span>
                <span className="text-text-secondary">
                  Market: <strong className="text-text-primary">${deal.marketValue.toLocaleString()}</strong>
                </span>
                <span className="text-success flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <strong>+${deal.profitPotential.toLocaleString()}</strong>
                </span>
              </div>

              {/* Metadata */}
              <div className="flex gap-4 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {deal.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Listed {deal.listedAt}
                </span>
                <span className="px-2 py-0.5 bg-surfaceSubtle rounded text-xs">{deal.marketplace}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="default">
                  View Details
                </Button>
                <Button size="sm" variant="outline">
                  Save for Later
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Usage in Page Component
 */
export default function FlipbombPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Car Flipper Dashboard</h1>

      {/* ✅ Section always renders - never conditional */}
      <CarFlipperSection />

      {/* Other sections */}
      <div>{/* Rest of page */}</div>
    </div>
  );
}
