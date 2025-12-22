/**
 * FeatureGate Component
 *
 * Enforces the rule: Feature flags disable BEHAVIOR, not VISIBILITY.
 *
 * This component ensures sections remain visible even when features are disabled,
 * preventing "Where did it go?" incidents.
 *
 * @rule Feature flags must NEVER remove sections from the DOM
 *
 * @example
 * ```tsx
 * <FeatureGate
 *   feature="car-flipper"
 *   enabled={process.env.NEXT_PUBLIC_SHOW_CAR_FLIPPER === "true"}
 * >
 *   {(isEnabled) =>
 *     isEnabled ? (
 *       <CarFlipperCards deals={deals} />
 *     ) : (
 *       <CarFlipperDisabled />
 *     )
 *   }
 * </FeatureGate>
 * ```
 */

import { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export interface FeatureGateProps {
  /**
   * Feature identifier (for debugging/observability)
   */
  feature: string;

  /**
   * Whether the feature is enabled
   */
  enabled: boolean;

  /**
   * Render function that receives enabled state
   * Must render something for BOTH enabled and disabled states
   */
  children: (isEnabled: boolean) => ReactNode;

  /**
   * Optional: Show a banner when feature is disabled
   * Default: true
   */
  showDisabledBanner?: boolean;

  /**
   * Optional: Custom disabled message
   */
  disabledMessage?: string;

  /**
   * Optional: Custom disabled rendering
   * If not provided, will render children(false) with optional banner
   */
  renderDisabled?: () => ReactNode;
}

/**
 * FeatureGate Component
 *
 * Contract:
 * 1. NEVER returns null
 * 2. ALWAYS renders something (enabled or disabled state)
 * 3. Disabled state shows the section with optional banner
 * 4. Provides data attributes for debugging
 */
export function FeatureGate({
  feature,
  enabled,
  children,
  showDisabledBanner = true,
  disabledMessage,
  renderDisabled,
}: FeatureGateProps) {
  // Always render - never null
  if (enabled) {
    return (
      <div data-feature={feature} data-feature-enabled="true">
        {children(true)}
      </div>
    );
  }

  // Feature is disabled - render disabled state
  return (
    <div data-feature={feature} data-feature-enabled="false">
      {renderDisabled ? (
        renderDisabled()
      ) : (
        <>
          {showDisabledBanner && (
            <Alert className="mb-4" variant="default">
              <Info className="h-4 w-4" />
              <AlertTitle>Feature Temporarily Paused</AlertTitle>
              <AlertDescription>
                {disabledMessage || `The ${feature} feature is currently disabled. Check back soon!`}
              </AlertDescription>
            </Alert>
          )}
          {children(false)}
        </>
      )}
    </div>
  );
}

/**
 * Simple Feature Toggle
 *
 * Alternative to FeatureGate when you just need a boolean check without
 * custom rendering. Still renders a placeholder when disabled.
 */
export interface FeatureToggleProps {
  feature: string;
  enabled: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureToggle({ feature, enabled, children, fallback }: FeatureToggleProps) {
  return (
    <div data-feature={feature} data-feature-enabled={enabled.toString()}>
      {enabled ? (
        children
      ) : fallback ? (
        fallback
      ) : (
        <Alert variant="default">
          <Info className="h-4 w-4" />
          <AlertDescription>This feature is currently disabled.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Hook: Check if feature is enabled
 *
 * Use this in components that need to disable actions, not visibility.
 *
 * @example
 * ```tsx
 * const isFlipperEnabled = useFeature("car-flipper");
 *
 * <Button disabled={!isFlipperEnabled}>
 *   {isFlipperEnabled ? "Start Scan" : "Feature Disabled"}
 * </Button>
 * ```
 */
export function useFeature(feature: string): boolean {
  // Map feature names to env vars
  const featureFlags: Record<string, boolean> = {
    "car-flipper":
      process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_SHOW_CAR_FLIPPER === "true",
    // Add more features here as needed
  };

  return featureFlags[feature] ?? false;
}

/**
 * Development-only Feature Gate
 *
 * Shows content in development mode, hides in production (but still renders a placeholder)
 */
export function DevOnlyGate({ children }: { children: ReactNode }) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div data-feature="dev-only" data-feature-enabled={isDev.toString()}>
      {isDev ? (
        children
      ) : (
        <Alert variant="default" className="opacity-50">
          <Info className="h-4 w-4" />
          <AlertDescription>This section is only visible in development mode.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
