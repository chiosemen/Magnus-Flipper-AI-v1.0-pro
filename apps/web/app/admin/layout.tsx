/**
 * Admin Layout - Protected with Full Guards Stack
 *
 * GUARDS APPLIED:
 * ===============
 * 1. ProtectedRoute - Requires authentication
 * 2. OnboardingGuard - Requires completed onboarding
 * 3. AdminGuard - Requires admin role
 *
 * SECURITY:
 * =========
 * This is the FIRST line of defense for admin routes.
 * - Runs client-side for instant feedback
 * - Middleware provides SECOND layer (edge runtime)
 * - Server-side guards provide THIRD layer (in pages)
 *
 * Defense in depth = Financial-grade security
 */

import { ReactNode } from 'react';
import { ProtectedRoute, OnboardingGuard, AdminGuard } from '@/components/guards/RouteGuards';
import { adminAutoHeal } from '@/lib/adminAutoHeal';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await adminAutoHeal();
  return (
    <ProtectedRoute>
      <OnboardingGuard>
        <AdminGuard>
          {children}
        </AdminGuard>
      </OnboardingGuard>
    </ProtectedRoute>
  );
}
