"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpgradeRequiredModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  title?: string;
  description?: ReactNode;
}

export function UpgradeRequiredModal({
  open,
  onClose,
  onUpgrade,
  title = "Upgrade required",
  description = "You have exceeded your Starter plan limits. Upgrade to continue adding searches.",
}: UpgradeRequiredModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onUpgrade}>Upgrade plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
