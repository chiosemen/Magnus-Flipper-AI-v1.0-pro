'use client';

/**
 * Route Guards - Client-side route protection components
 *
 * UI-ONLY MODE: All guards always render children (no auth checks)
 * - ProtectedRoute: Always renders children
 * - OnboardingGuard: Always renders children
 * - AdminGuard: Always renders children
 */

interface GuardProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Requires user to be authenticated
 * Redirects to /login if not authenticated
 * UI-ONLY MODE: Always renders children
 */
export function ProtectedRoute({ children }: GuardProps) {
  // UI-ONLY DEPLOYMENT: Always render children
  return <>{children}</>;
}

/**
 * OnboardingGuard - Requires user to have completed onboarding
 * Redirects to /onboarding if not completed
 * UI-ONLY MODE: Always renders children
 */
export function OnboardingGuard({ children }: GuardProps) {
  // UI-ONLY DEPLOYMENT: Always render children
  return <>{children}</>;
}

/**
 * AdminGuard - Requires user to have admin role
 * Redirects to /unauthorized if not admin
 * UI-ONLY MODE: Always renders children
 */
export function AdminGuard({ children }: GuardProps) {
  // UI-ONLY DEPLOYMENT: Always render children
  return <>{children}</>;
}
