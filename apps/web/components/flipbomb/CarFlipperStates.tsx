/**
 * Car Flipper Section States
 *
 * Deterministic state components for the Car Flipper section.
 * These ensure the section NEVER disappears, regardless of data state.
 *
 * @rule All states render the same layout shell with different content
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/flipbomb/ui/alert";
import { AlertCircle, Car, RefreshCw } from "lucide-react";

/**
 * Loading State - Deterministic Skeleton
 *
 * Shows exactly 3 placeholder cards (always the same count)
 */
export function CarFlipperSkeleton() {
  return (
    <div className="space-y-4" data-state="loading">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4 animate-pulse">
          <div className="flex gap-4">
            {/* Image skeleton */}
            <div className="w-32 h-32 bg-surfaceSubtle rounded-md flex-shrink-0" />

            {/* Content skeleton */}
            <div className="flex-1 space-y-3">
              {/* Title */}
              <div className="h-5 bg-surfaceSubtle rounded w-3/4" />

              {/* Price row */}
              <div className="flex gap-4">
                <div className="h-4 bg-surfaceSubtle rounded w-24" />
                <div className="h-4 bg-surfaceSubtle rounded w-24" />
              </div>

              {/* Description lines */}
              <div className="space-y-2">
                <div className="h-3 bg-surfaceSubtle rounded w-full" />
                <div className="h-3 bg-surfaceSubtle rounded w-5/6" />
              </div>

              {/* Action buttons skeleton */}
              <div className="flex gap-2 pt-2">
                <div className="h-9 bg-surfaceSubtle rounded w-24" />
                <div className="h-9 bg-surfaceSubtle rounded w-24" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Empty State - Explains What Will Appear
 *
 * Shows placeholder cards that explain the feature
 */
export function CarFlipperEmpty() {
  return (
    <div className="space-y-6" data-state="empty">
      <Card className="p-12 text-center space-y-4 border-dashed">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Car className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-lg">No Active Flip Opportunities</h3>
          <p className="text-text-secondary max-w-md mx-auto">
            Car flip deals will appear here when our AI identifies undervalued listings across
            marketplaces. Set up your preferences to get started.
          </p>
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <Button variant="default">Set Up Deal Alerts</Button>
          <Button variant="outline">Learn How It Works</Button>
        </div>
      </Card>

      {/* Example placeholder cards showing what will appear */}
      <div className="space-y-4 opacity-50">
        <p className="text-sm text-text-secondary text-center">Example flip opportunities:</p>

        {[
          {
            title: "2019 Toyota Camry LE",
            listing: "$12,500",
            market: "$15,800",
            profit: "+$3,300",
          },
          {
            title: "2020 Honda Civic Sport",
            listing: "$16,200",
            market: "$19,500",
            profit: "+$3,300",
          },
        ].map((example, i) => (
          <Card key={i} className="p-4 border-dashed">
            <div className="flex gap-4">
              <div className="w-32 h-32 bg-surfaceSubtle rounded-md flex-shrink-0 flex items-center justify-center">
                <Car className="w-12 h-12 text-text-tertiary" />
              </div>

              <div className="flex-1 space-y-2">
                <h4 className="font-medium">{example.title}</h4>
                <div className="flex gap-4 text-sm">
                  <span>
                    Listing: <strong>{example.listing}</strong>
                  </span>
                  <span>
                    Market: <strong>{example.market}</strong>
                  </span>
                  <span className="text-success">
                    Profit: <strong>{example.profit}</strong>
                  </span>
                </div>
                <p className="text-sm text-text-secondary">
                  Located 12 miles away • Live signal
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Error State - Actionable Recovery
 */
export function CarFlipperError({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="space-y-4" data-state="error">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to Load Flip Opportunities</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{error.message || "An unexpected error occurred while loading car flip deals."}</p>

          <div className="flex gap-2 pt-2">
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "mailto:support@example.com")}
            >
              Contact Support
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Show skeleton underneath so section doesn't collapse */}
      <div className="opacity-30 pointer-events-none">
        <CarFlipperSkeleton />
      </div>
    </div>
  );
}

/**
 * Disabled State - Feature Flag Off
 *
 * Used when NEXT_PUBLIC_SHOW_CAR_FLIPPER is false
 */
export function CarFlipperDisabled() {
  return (
    <div className="space-y-4" data-state="disabled">
      <Alert variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Car Flipper Temporarily Paused</AlertTitle>
        <AlertDescription>
          We're enhancing the car flip detection algorithm. This feature will be back online soon!
        </AlertDescription>
      </Alert>

      {/* Show grayed-out example so users know what to expect */}
      <div className="opacity-30 pointer-events-none">
        <CarFlipperEmpty />
      </div>
    </div>
  );
}
