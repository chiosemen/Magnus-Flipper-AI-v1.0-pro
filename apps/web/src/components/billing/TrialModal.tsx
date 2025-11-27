"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStartTrial } from "@/lib/queries/useTrial";

interface TrialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrialModal({ open, onOpenChange }: TrialModalProps) {
  const router = useRouter();
  const { startTrial } = useStartTrial();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await startTrial();
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
      router.push("/dashboard");
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Unable to start trial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Your 7-Day Free Trial</DialogTitle>
          <DialogDescription>
            Instant access to flipping alerts, faster scan frequency, and marketplace coverage. Cancel anytime during
            the trial.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm text-slate-300">
          <p>• Faster scans across all supported marketplaces</p>
          <p>• Instant notifications on new matches</p>
          <p>• Priority spam filtering and deal scoring</p>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={loading}>
            {loading ? "Activating..." : "Activate Trial"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
