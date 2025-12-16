'use client';

/**
 * Tech Trade Risk Control Admin Panel
 * 
 * Route: /admin/tech-trade/risk
 * 
 * This is an INTERNAL ADMIN interface for controlling the pricing kill switch.
 * All changes require explicit confirmation and reason.
 * 
 * UX Requirements:
 * - Big, unmistakable status indicator
 * - Required reason text input (min 10 characters)
 * - Required confirmation checkbox
 * - Button disabled until both conditions met
 * - No auto-save, no accidental clicks
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';

// ============================================================================
// Types
// ============================================================================

interface AuditLogEntry {
  timestamp: string;
  admin: string;
  action: 'HALT' | 'RESUME';
  reason: string;
  previousState: {
    pricingHalted: boolean;
    haltReason?: string;
  };
  newState: {
    pricingHalted: boolean;
    haltReason?: string;
  };
}

interface RiskStatus {
  pricingHalted: boolean;
  haltReason: string | null;
  haltedAt: string | null;
  haltedBy: string | null;
  source: 'env' | 'admin';
  recentChanges: AuditLogEntry[];
}

// ============================================================================
// Components
// ============================================================================

function StatusIndicator({ halted }: { halted: boolean }) {
  if (halted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-red-500 rounded-lg opacity-30 animate-ping" />
          <div className="relative bg-red-600 text-white px-8 py-4 rounded-lg text-2xl font-bold">
            PRICING HALTED
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center p-8">
      <div className="bg-emerald-600 text-white px-8 py-4 rounded-lg text-2xl font-bold">
        PRICING ACTIVE
      </div>
    </div>
  );
}

function StatusDetails({ status }: { status: RiskStatus }) {
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-slate-400">Source:</span>
        <span className="ml-2 font-mono">
          {status.source === 'env' ? 'Environment Variable' : 'Admin Override'}
        </span>
      </div>
      {status.haltedAt && (
        <div>
          <span className="text-slate-400">Last Changed:</span>
          <span className="ml-2 font-mono">
            {new Date(status.haltedAt).toLocaleString()}
          </span>
        </div>
      )}
      {status.haltedBy && (
        <div>
          <span className="text-slate-400">Changed By:</span>
          <span className="ml-2 font-mono">{status.haltedBy}</span>
        </div>
      )}
      {status.haltReason && (
        <div className="col-span-2">
          <span className="text-slate-400">Reason:</span>
          <span className="ml-2">{status.haltReason}</span>
        </div>
      )}
    </div>
  );
}

function ChangeForm({
  currentlyHalted,
  onSubmit,
  loading,
}: {
  currentlyHalted: boolean;
  onSubmit: (halt: boolean, reason: string) => Promise<void>;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const newState = !currentlyHalted; // Toggle
  const canSubmit = reason.length >= 10 && confirmed && !loading;
  
  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      await onSubmit(newState, reason);
      setSuccess(`Pricing ${newState ? 'halted' : 'resumed'} successfully`);
      setReason('');
      setConfirmed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="p-4 border border-slate-700 rounded-lg">
        <div className="text-lg font-medium mb-4">
          {currentlyHalted ? (
            <span className="text-emerald-400">Resume Pricing</span>
          ) : (
            <span className="text-red-400">Halt Pricing</span>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Reason <span className="text-red-400">*</span>
              <span className="text-slate-400 font-normal ml-2">(min 10 characters)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={currentlyHalted 
                ? "e.g., Market conditions stabilized, resuming normal operations"
                : "e.g., Market volatility detected, halting for investigation"
              }
              className="w-full h-24 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <div className="text-xs text-slate-400 mt-1">
              {reason.length}/10 characters minimum
            </div>
          </div>
          
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-amber-200 text-sm">
                {currentlyHalted ? (
                  <>
                    I understand that <strong>resuming pricing</strong> will re-enable 
                    market anchor blending and allow bulk trades for all Tech Trade operations.
                  </>
                ) : (
                  <>
                    I understand that <strong>halting pricing</strong> will disable 
                    market anchor blending, freeze B2C quotes, and reject all bulk/B2B trades.
                  </>
                )}
              </span>
            </label>
          </div>
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">
              {success}
            </div>
          )}
          
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full ${
              currentlyHalted
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-red-600 hover:bg-red-500'
            } ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              'Processing...'
            ) : currentlyHalted ? (
              'RESUME PRICING'
            ) : (
              'HALT PRICING'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AuditLog({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="text-slate-400 text-center py-4">
        No recent changes recorded
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-2 px-3 text-slate-400 font-medium">Timestamp</th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium">Admin</th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium">Action</th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium">Reason</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={i} className="border-b border-slate-800">
              <td className="py-2 px-3 font-mono text-xs">
                {new Date(entry.timestamp).toLocaleString()}
              </td>
              <td className="py-2 px-3 font-mono text-xs">
                {entry.admin}
              </td>
              <td className="py-2 px-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  entry.action === 'HALT'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {entry.action}
                </span>
              </td>
              <td className="py-2 px-3 max-w-xs truncate" title={entry.reason}>
                {entry.reason}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function RiskControlPage() {
  const [status, setStatus] = useState<RiskStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/tech-trade/risk');
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch risk control status');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchStatus();
    // Poll every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);
  
  const handleUpdate = async (halt: boolean, reason: string) => {
    setUpdating(true);
    
    try {
      const response = await fetch('/api/admin/tech-trade/risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricingHalted: halt,
          reason,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Update failed');
      }
      
      // Refresh status
      await fetchStatus();
    } finally {
      setUpdating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">Loading risk control status...</div>
        </div>
      </div>
    );
  }
  
  if (error || !status) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 text-red-400">
            {error || 'Failed to load status'}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Tech Trade Risk Control</h1>
            <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded">
              Internal Admin
            </span>
          </div>
          <p className="text-slate-400">
            Control the global pricing kill switch for Tech Trade operations
          </p>
        </div>
        
        {/* Current Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
            <CardDescription>
              Real-time pricing system state
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusIndicator halted={status.pricingHalted} />
            <StatusDetails status={status} />
          </CardContent>
        </Card>
        
        {/* Change Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Change Pricing State</CardTitle>
            <CardDescription>
              {status.pricingHalted 
                ? 'Resume pricing to re-enable market signals'
                : 'Halt pricing to disable market signals'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangeForm
              currentlyHalted={status.pricingHalted}
              onSubmit={handleUpdate}
              loading={updating}
            />
          </CardContent>
        </Card>
        
        {/* Audit Log */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Changes</CardTitle>
            <CardDescription>
              Audit trail of risk control modifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuditLog entries={status.recentChanges} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

