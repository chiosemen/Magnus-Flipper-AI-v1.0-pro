'use client';

/**
 * Route Guards - Client-side route protection components
 *
 * These guards provide defense-in-depth authentication and authorization:
 * - ProtectedRoute: Requires authentication
 * - OnboardingGuard: Requires completed onboarding
 * - AdminGuard: Requires admin role
 *
 * NOTE: These are CLIENT-SIDE guards. Server-side verification is still required
 * in page components and API routes for security.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';

interface GuardProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Requires user to be authenticated
 * Redirects to /login if not authenticated
 */
export function ProtectedRoute({ children }: GuardProps) {
  // DEVELOPMENT MODE: Bypass auth check
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH_GUARD === 'true') {
    console.log('[ProtectedRoute] 🚫 AUTH DISABLED - Rendering without check');
    return <>{children}</>;
  }

  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show nothing while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-[#4FF0E6] text-lg">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4FF0E6] border-t-transparent mr-3"></div>
          Loading...
        </div>
      </div>
    );
  }

  // Don't render children until authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

/**
 * OnboardingGuard - Requires user to have completed onboarding
 * Redirects to /onboarding if not completed
 */
export function OnboardingGuard({ children }: GuardProps) {
  // DEVELOPMENT MODE: Bypass onboarding check
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH_GUARD === 'true') {
    console.log('[OnboardingGuard] 🚫 AUTH DISABLED - Rendering without check');
    return <>{children}</>;
  }

  const { profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && profile && !profile.onboarding_completed) {
      router.push('/onboarding');
    }
  }, [profile, isLoading, router]);

  // Show nothing while checking onboarding status
  if (isLoading) {
    return null;
  }

  // Don't render children until onboarding is complete
  if (!profile?.onboarding_completed) {
    return null;
  }

  return <>{children}</>;
}

/**
 * AdminGuard - Requires user to have admin role
 * Redirects to /unauthorized if not admin
 */
export function AdminGuard({ children }: GuardProps) {
  // DEVELOPMENT MODE: Bypass admin check
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH_GUARD === 'true') {
    console.log('[AdminGuard] 🚫 AUTH DISABLED - Rendering without check');
    return <>{children}</>;
  }

  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/unauthorized');
    }
  }, [isAdmin, isLoading, router]);

  // Show nothing while checking admin status
  if (isLoading) {
    return null;
  }

  // Don't render children until admin verified
  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
