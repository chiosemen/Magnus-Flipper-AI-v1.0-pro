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
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
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
  const { user, loading } = useAuth();
  const router = useRouter();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && user) {
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
  }, [user, loading, router]);

  if (loading || onboardingComplete === null) {
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
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      const checkAdminStatus = async () => {
        const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

        if (!isProduction) {
          // NON-PRODUCTION: Auto-grant admin access for testing
          console.log('[AdminGuard] Non-production mode: Auto-granting admin access');
          setIsAdmin(true);
          setChecking(false);
          return;
        }

        // PRODUCTION: Check email allowlist
        const adminAllowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST || '')
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean);

        if (adminAllowlist.length === 0) {
          console.error('[AdminGuard] CRITICAL: ADMIN_EMAIL_ALLOWLIST is empty in production');
          setIsAdmin(false);
          setChecking(false);
          router.push('/unauthorized');
          return;
        }

        const userEmail = user.email?.toLowerCase() || '';
        const isAllowed = adminAllowlist.some((email) => email.toLowerCase() === userEmail);

        if (!isAllowed) {
          console.warn('[AdminGuard] Access denied:', {
            email: user.email,
            allowlist: adminAllowlist,
          });
          setIsAdmin(false);
          setChecking(false);
          router.push('/unauthorized');
          return;
        }

        // Additionally verify admin status in database
        const supabase = supabaseBrowser();
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, role')
          .eq('id', user.id)
          .single();

        if (profile?.is_admin && profile?.role === 'admin') {
          setIsAdmin(true);
        } else {
          console.warn('[AdminGuard] User in allowlist but not marked as admin in DB:', user.email);
          setIsAdmin(false);
          router.push('/unauthorized');
        }
        setChecking(false);
      };

      checkAdminStatus();
    }
  }, [user, loading, router]);

  if (loading || checking) {
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
