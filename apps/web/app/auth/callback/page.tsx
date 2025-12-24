'use client';

/**
 * Auth Callback Handler
 *
 * RESPONSIBILITIES:
 * =================
 * 1. Exchange auth code for session (Supabase handles this)
 * 2. Check if user has completed onboarding
 * 3. Redirect to:
 *    - Stored redirect URL (from localStorage)
 *    - /onboarding (if not completed)
 *    - /dashboard (default)
 *
 * SECURITY:
 * =========
 * - Only redirects to internal paths (no open redirect vulnerability)
 * - Clears stored redirect after use
 * - Handles race conditions with session hydration
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

const ALLOWED_REDIRECT_PATHS = ['/dashboard', '/admin', '/profile', '/settings'];

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = supabaseBrowser();

        // Exchange code for session
        // Supabase automatically handles this via the URL params
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[AuthCallback] Session error:', sessionError);
          setError('Authentication failed. Please try again.');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        if (!session) {
          console.warn('[AuthCallback] No session after callback');
          router.push('/login');
          return;
        }

        // Fetch user profile to check onboarding status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('[AuthCallback] Profile error:', profileError);
          // Profile might not exist yet (trigger hasn't fired)
          // Wait a bit and retry
          await new Promise(resolve => setTimeout(resolve, 500));

          const { data: retryProfile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .single();

          if (!retryProfile) {
            // Still no profile - redirect to dashboard anyway
            router.push('/dashboard');
            return;
          }

          if (!retryProfile.onboarding_completed) {
            router.push('/onboarding');
            return;
          }
        }

        // Check if user needs onboarding
        if (profile && !profile.onboarding_completed) {
          router.push('/onboarding');
          return;
        }

        // Check for stored redirect URL
        const storedRedirect = localStorage.getItem('post_auth_redirect');

        if (storedRedirect) {
          // Clear stored redirect
          localStorage.removeItem('post_auth_redirect');

          // Validate redirect is safe (internal path only)
          if (ALLOWED_REDIRECT_PATHS.some(path => storedRedirect.startsWith(path))) {
            router.push(storedRedirect);
            return;
          }
        }

        // Check URL search params for redirect
        const redirectParam = searchParams.get('redirect');
        if (redirectParam && ALLOWED_REDIRECT_PATHS.some(path => redirectParam.startsWith(path))) {
          router.push(redirectParam);
          return;
        }

        // Default: redirect to dashboard
        router.push('/dashboard');

      } catch (err) {
        console.error('[AuthCallback] Unexpected error:', err);
        setError('An unexpected error occurred. Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-md">
          <div className="text-red-400 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-lg font-semibold mb-2">Authentication Error</p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4FF0E6] border-t-transparent mb-4"></div>
        <p className="text-[#ededed] text-lg">Completing authentication...</p>
        <p className="text-[#6E7681] text-sm mt-2">Please wait while we redirect you</p>
      </div>
    </div>
  );
}

