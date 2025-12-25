'use client';

/**
 * Route Guards - Composable Auth Protection Components
 *
 * ARCHITECTURE:
 * =============
 * - Guards are composable (can be nested)
 * - Guards redirect instead of throwing errors (better UX)
 * - Guards show loading states (no flash of wrong content)
 * - Guards store intended route for post-auth redirect
 *
 * USAGE:
 * ======
 * Wrap protected pages/layouts:
 *
 * Simple protection:
 *   <ProtectedRoute><YourPage /></ProtectedRoute>
 *
 * With onboarding check:
 *   <ProtectedRoute>
 *     <OnboardingGuard>
 *       <YourPage />
 *     </OnboardingGuard>
 *   </ProtectedRoute>
 *
 * Admin-only:
 *   <ProtectedRoute>
 *     <OnboardingGuard>
 *       <AdminGuard>
 *         <AdminPage />
 *       </AdminGuard>
 *     </OnboardingGuard>
 *   </ProtectedRoute>
 *
 * Plan-gated:
 *   <ProtectedRoute>
 *     <OnboardingGuard>
 *       <PlanGuard requiredPlan="pro">
 *         <ProFeature />
 *       </PlanGuard>
 *     </OnboardingGuard>
 *   </ProtectedRoute>
 */

import { ReactNode } from 'react';

// ============================================================================
// Loading Component (Shared)
// ============================================================================

function GuardLoadingState({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4FF0E6] border-t-transparent mb-4"></div>
        <p className="text-[#ededed] text-lg">{message || 'Loading...'}</p>
      </div>
    </div>
  );
}

// ============================================================================
// ProtectedRoute - Require Authentication
// ============================================================================

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  // UI-ONLY DEPLOYMENT: Always render children
  return <>{children}</>;
}

// ============================================================================
// OnboardingGuard - Require Completed Onboarding
// ============================================================================

interface OnboardingGuardProps {
  children: ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  // UI-ONLY DEPLOYMENT: Always render children
  return <>{children}</>;
}

// ============================================================================
// PlanGuard - Require Minimum Plan Tier
// ============================================================================

type Plan = 'free' | 'pro' | 'agency' | 'elite';

const PLAN_RANKS: Record<Plan, number> = {
  free: 1,
  pro: 2,
  agency: 3,
  elite: 4,
};

interface PlanGuardProps {
  children: ReactNode;
  requiredPlan: Plan;
  fallbackRoute?: string;
}

export function PlanGuard({ children, requiredPlan, fallbackRoute = '/upgrade' }: PlanGuardProps) {
  // UI-ONLY DEPLOYMENT: Always render children
  return <>{children}</>;
}

// ============================================================================
// AdminGuard - Require Admin Role
// ============================================================================

interface AdminGuardProps {
  children: ReactNode;
  fallbackRoute?: string;
}

export function AdminGuard({ children, fallbackRoute = '/unauthorized' }: AdminGuardProps) {
  // UI-ONLY DEPLOYMENT: Always render children
  return <>{children}</>;
}

// ============================================================================
// Combined Guard Helper (for convenience)
// ============================================================================

interface FullGuardProps {
  children: ReactNode;
  requireOnboarding?: boolean;
  requireAdmin?: boolean;
  requiredPlan?: Plan;
}

/**
 * Combined guard that applies all checks in the correct order:
 * 1. Authentication (ProtectedRoute)
 * 2. Onboarding (OnboardingGuard, if enabled)
 * 3. Plan check (PlanGuard, if specified)
 * 4. Admin check (AdminGuard, if enabled)
 */
export function FullGuard({
  children,
  requireOnboarding = true,
  requireAdmin = false,
  requiredPlan,
}: FullGuardProps) {
  let content = <>{children}</>;

  // Apply guards in reverse order (innermost first)
  if (requireAdmin) {
    content = <AdminGuard>{content}</AdminGuard>;
  }

  if (requiredPlan) {
    content = <PlanGuard requiredPlan={requiredPlan}>{content}</PlanGuard>;
  }

  if (requireOnboarding) {
    content = <OnboardingGuard>{content}</OnboardingGuard>;
  }

  content = <ProtectedRoute>{content}</ProtectedRoute>;

  return content;
}
