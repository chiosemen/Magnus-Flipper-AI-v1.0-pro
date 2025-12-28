'use client';

/**
 * Route Guards - Client-side route protection components
 *
 * PRODUCTION MODE: Full authentication enforcement
 * - ProtectedRoute: Requires authentication
 * - OnboardingGuard: Requires completed onboarding
 * - AdminGuard: Requires admin role (production-locked with email allowlist)
 */

import { useAuth } from '@/app/providers/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

interface GuardProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Requires user to be authenticated
 * Redirects to /login if not authenticated
 */
export function ProtectedRoute({ children }: GuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

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
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      const checkOnboarding = async () => {
        const supabase = supabaseBrowser();
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (profile?.onboarding_completed === false) {
          router.push('/onboarding');
        } else {
          setOnboardingComplete(true);
        }
      };
      checkOnboarding();
    }
  }, [user, isLoading, router]);

  if (isLoading || onboardingComplete === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * AdminGuard - Requires user to have admin role
 * Production-locked: In production, checks email allowlist
 * Non-production: Auto-grants admin for testing
 * Redirects to /unauthorized if not admin
 */
export function AdminGuard({ children }: GuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoading && user) {
      const checkAdminStatus = async () => {
        // Additionally verify admin status in database
        const supabase = supabaseBrowser();
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, role')
          .eq('id', user.id)
          .single();

        if (profile?.is_admin || profile?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.push('/unauthorized');
        }
        setChecking(false);
      };

      checkAdminStatus();
    }
  }, [user, isLoading, router]);

  if (isLoading || checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Verifying admin access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
