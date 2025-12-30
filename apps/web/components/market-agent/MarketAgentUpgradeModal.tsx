'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function MarketAgentUpgradeModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const handleUpgrade = async () => {
    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'market_agent' }),
      });

      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to Magnus Market Agent</DialogTitle>
          <DialogDescription>
            Autonomous market observation with freshness and verification signals.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <li>• Persistent market observation (not one-off search)</li>
            <li>• Live Capture and VERIFIED listings</li>
            <li>• Freshness indicators on every result</li>
            <li>• Priority concurrency and agent routing</li>
            <li>• Dedicated Market Agent console</li>
          </ul>
          <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="text-2xl font-bold">£79 / month</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Cancel anytime</div>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
          <Button onClick={handleUpgrade}>Upgrade now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

