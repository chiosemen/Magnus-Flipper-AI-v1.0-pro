'use client';

/**
 * Change Requests Table Component
 * Displays and manages operator change requests
 */

import { useState, useEffect } from 'react';
import { Card } from '@/marketing-swoopa/components/ui/card';
import { Badge } from '@/marketing-swoopa/components/ui/badge';
import { Button } from '@/marketing-swoopa/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/marketing-swoopa/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/marketing-swoopa/components/ui/alert-dialog';

interface ChangeRequest {
  id: string;
  created_at: string;
  status: string;
  marketplace?: string;
  change_type: string;
  risk_level: string;
  rationale: string;
  rollback_plan: string;
  hypothesis: string;
  expected_effect: string;
}

export function ChangeRequestsTable() {
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
    change: ChangeRequest | null;
  }>({
    open: false,
    action: null,
    change: null,
  });

  const fetchChanges = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/operator/changes');
      if (!res.ok) {
        throw new Error('Failed to fetch change requests');
      }

      const data = await res.json();
      setChanges(data.changes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges();
  }, []);

  const handleAction = async (changeId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/operator/changes/${changeId}/${action}`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to ${action} change request`);
      }

      // Refresh the list
      await fetchChanges();
      setConfirmDialog({ open: false, action: null, change: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const openConfirmDialog = (change: ChangeRequest, action: 'approve' | 'reject') => {
    setConfirmDialog({ open: true, action, change });
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Change Requests</h2>
          <Button onClick={fetchChanges} variant="outline" size="sm" disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            Error: {error}
          </div>
        )}

        {/* Table */}
        {!loading && !error && changes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No change requests found
          </div>
        )}

        {!loading && !error && changes.length > 0 && (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rationale</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changes.map((change) => (
                  <TableRow key={change.id}>
                    <TableCell className="text-sm">
                      {new Date(change.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {change.marketplace ? (
                        <Badge variant="outline">{change.marketplace}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{change.change_type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          change.risk_level === 'high'
                            ? 'destructive'
                            : change.risk_level === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {change.risk_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          change.status === 'proposed'
                            ? 'default'
                            : change.status === 'approved'
                            ? 'default'
                            : change.status === 'rejected'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {change.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {change.rationale}
                    </TableCell>
                    <TableCell>
                      {change.status === 'proposed' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => openConfirmDialog(change, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openConfirmDialog(change, 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Loading change requests...
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, action: null, change: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'approve' ? 'Approve' : 'Reject'} Change Request
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {confirmDialog.change && (
                  <>
                    <div>
                      <span className="font-semibold">Marketplace:</span>{' '}
                      {confirmDialog.change.marketplace || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">Type:</span>{' '}
                      {confirmDialog.change.change_type}
                    </div>
                    <div>
                      <span className="font-semibold">Hypothesis:</span>{' '}
                      {confirmDialog.change.hypothesis}
                    </div>
                    <div>
                      <span className="font-semibold">Expected Effect:</span>{' '}
                      {confirmDialog.change.expected_effect}
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="font-semibold mb-1">Rollback Plan:</div>
                      <div className="text-sm">{confirmDialog.change.rollback_plan}</div>
                    </div>
                  </>
                )}
                <p className="text-sm text-muted-foreground">
                  {confirmDialog.action === 'approve'
                    ? 'This will mark the change request as approved. The change will NOT be applied automatically.'
                    : 'This will reject the change request.'}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmDialog.change &&
                confirmDialog.action &&
                handleAction(confirmDialog.change.id, confirmDialog.action)
              }
            >
              {confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

