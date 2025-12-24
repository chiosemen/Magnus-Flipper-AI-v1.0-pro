'use client';

/**
 * Dashboard Layout - Protected with Guards
 *
 * GUARDS APPLIED:
 * ===============
 * 1. ProtectedRoute - Requires authentication
 * 2. OnboardingGuard - Requires completed onboarding
 *
 * All dashboard pages inherit these protections
 */

import { ReactNode } from 'react';
import { ProtectedRoute, OnboardingGuard } from '@/components/guards/RouteGuards';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <OnboardingGuard>
        {children}
      </OnboardingGuard>
    </ProtectedRoute>
  );
}
