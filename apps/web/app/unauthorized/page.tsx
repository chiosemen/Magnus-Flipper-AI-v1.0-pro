'use client';

/**
 * Unauthorized Page
 *
 * Shown when user tries to access admin-only or plan-restricted content
 */

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';

export const dynamic = 'force-dynamic';

export default function UnauthorizedPage() {
  // Gate: disable during build or when env flag is set
  if (process.env.NEXT_PUBLIC_DISABLE_ONBOARDING === 'true') {
    return <div style={{ display: 'none' }} />;
  }

  return (
    <Suspense fallback={<div style={{ display: 'none' }} />}>
      <UnauthorizedInner />
    </Suspense>
  );
}

function UnauthorizedInner() {
  const router = useRouter();
  const { isAdmin, profile } = useAuth();

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-[#ededed] mb-3">
            Access Denied
          </h1>
          <p className="text-[#6E7681] mb-6">
            {isAdmin
              ? "You don't have permission to access this resource."
              : "This page requires admin privileges."}
          </p>

          {!isAdmin && (profile?.plan === 'free' || profile?.plan === 'trial') && (
            <div className="bg-[#8A4FFF]/10 border border-[#8A4FFF]/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-[#ededed]">
                Upgrade to access premium features
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.back()}
              className="w-full bg-[#1a1a1a] border border-[#4FF0E6] text-[#4FF0E6] px-6 py-3 rounded-lg font-semibold hover:bg-[#4FF0E6]/10 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-[#4FF0E6] text-[#0D1117] px-6 py-3 rounded-lg font-semibold hover:bg-[#3dd9cf] transition-colors"
            >
              Go to Dashboard
            </button>
            {!isAdmin && (
              <button
                onClick={() => router.push('/upgrade')}
                className="w-full bg-[#8A4FFF] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#7a3fe0] transition-colors"
              >
                View Plans
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
