'use client';

/**
 * Demo Mode Hook - Client-side demo data detection
 *
 * USAGE:
 * ======
 * const { isDemoMode, demoData } = useDemoMode();
 *
 * if (isDemoMode) {
 *   return <DashboardUI data={demoData} />;
 * }
 *
 * // Otherwise fetch real data
 *
 * DETECTION:
 * ==========
 * Email contains "@demo." or "@example."
 * Examples: admin@demo.magnus.ai, test@example.com
 *
 * REMOVAL:
 * ========
 * To disable:
 * 1. Delete this file
 * 2. Remove useDemoMode() calls
 * 3. Remove conditional rendering
 */

import { useAuth } from '@/app/providers/AuthProvider';
import { getDemoDashboardData, isDemoUser } from './demoData';

export function useDemoMode() {
  const { user } = useAuth();

  const isDemoMode = isDemoUser(user?.email);
  const demoData = isDemoMode ? getDemoDashboardData() : null;

  return {
    isDemoMode,
    demoData,
  };
}
