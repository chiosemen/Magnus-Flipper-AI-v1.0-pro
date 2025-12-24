/**
 * Operator Agent Admin UI
 * Internal admin-only interface for Magnus Operator Agent
 * 
 * SECURITY: Server-side admin guard enforced
 * CONSTRAINTS: Read-only + approval-gated, no autonomous actions
 */

import { getUser } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { AskOperator } from './components/AskOperator';
import { AnomaliesTable } from './components/AnomaliesTable';
import { ChangeRequestsTable } from './components/ChangeRequestsTable';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OperatorAdminPage() {
  // ========================================================================
  // ADMIN GUARD: Server-side enforcement (PRIMARY SECURITY LAYER)
  // ========================================================================
  const user = await getUser();

  // Unauthorized: No user session
  if (!user) {
    redirect('/login');
  }

  // Forbidden: User exists but is not admin
  const userRole = user.app_metadata?.role as string | undefined;
  if (userRole !== 'admin') {
    // Fail-closed: Return 404 to non-admins (hides route existence)
    notFound();
  }

  // ========================================================================
  // Admin verified - proceed with operator UI
  // ========================================================================
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Operator Agent</h1>
          <p className="text-muted-foreground">
            Internal intelligence and orchestration system for marketplace scraping
          </p>
        </div>

        {/* Ask Operator Panel */}
        <AskOperator />

        {/* Recent Anomalies */}
        <AnomaliesTable />

        {/* Change Requests */}
        <ChangeRequestsTable />
      </div>
    </div>
  );
}

