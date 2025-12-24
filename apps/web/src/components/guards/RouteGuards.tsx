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

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

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
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Store current path for post-auth redirect
      if (pathname && pathname !== '/login') {
        localStorage.setItem('post_auth_redirect', pathname);
      }

      // Redirect to login with redirect param
      const redirectUrl = new URL(redirectTo, window.location.origin);
      redirectUrl.searchParams.set('redirect', pathname || '/dashboard');
      router.push(redirectUrl.toString().replace(window.location.origin, ''));
    }
  }, [isAuthenticated, loading, router, pathname, redirectTo]);

  // Show loading state while checking auth
  if (loading) {
    return <GuardLoadingState message="Verifying authentication..." />;
  }

  // Not authenticated - will redirect (show loading during redirect)
  if (!isAuthenticated) {
    return <GuardLoadingState message="Redirecting to login..." />;
  }

  // Authenticated - render children
  return <>{children}</>;
}

// ============================================================================
// OnboardingGuard - Require Completed Onboarding
// ============================================================================

interface OnboardingGuardProps {
  children: ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { profile, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && profile) {
      if (!profile.onboarding_completed) {
        router.push('/onboarding');
      }
    }
  }, [profile, loading, isAuthenticated, router]);

  // Show loading while checking profile
  if (loading || !profile) {
    return <GuardLoadingState message="Checking onboarding status..." />;
  }

  // Onboarding not completed - will redirect
  if (!profile.onboarding_completed) {
    return <GuardLoadingState message="Redirecting to onboarding..." />;
  }

  // Onboarding completed - render children
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
  const { profile, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && profile) {
      const userPlanRank = PLAN_RANKS[profile.plan as Plan] || 0;
      const requiredPlanRank = PLAN_RANKS[requiredPlan] || 0;

      if (userPlanRank < requiredPlanRank) {
        // User's plan is insufficient - redirect to upgrade
        const upgradeUrl = new URL(fallbackRoute, window.location.origin);
        upgradeUrl.searchParams.set('required', requiredPlan);
        router.push(upgradeUrl.toString().replace(window.location.origin, ''));
      }
    }
  }, [profile, loading, isAuthenticated, router, requiredPlan, fallbackRoute]);

  // Show loading while checking profile
  if (loading || !profile) {
    return <GuardLoadingState message="Checking plan access..." />;
  }

  const userPlanRank = PLAN_RANKS[profile.plan as Plan] || 0;
  const requiredPlanRank = PLAN_RANKS[requiredPlan] || 0;

  // Insufficient plan - will redirect
  if (userPlanRank < requiredPlanRank) {
    return <GuardLoadingState message={`Redirecting to upgrade (${requiredPlan} required)...`} />;
  }

  // Plan sufficient - render children
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
  const { profile, isAdmin, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && profile) {
      if (!isAdmin) {
        router.push(fallbackRoute);
      }
    }
  }, [profile, isAdmin, loading, isAuthenticated, router, fallbackRoute]);

  // Show loading while checking profile
  if (loading || !profile) {
    return <GuardLoadingState message="Verifying admin access..." />;
  }

  // Not admin - will redirect
  if (!isAdmin) {
    return <GuardLoadingState message="Access denied. Redirecting..." />;
  }

  // Admin verified - render children
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
