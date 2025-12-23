/**
 * Stub toast hook
 */
import { useState } from "react";

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
};

export function toast(props: Omit<Toast, "id">) {
  // Stub implementation
  console.log("Toast:", props);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toastFn = (props: Omit<Toast, "id">) => {
    const id = String(Date.now());
    setToasts((prev) => [...prev, { ...props, id }]);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toast: toastFn, toasts, dismiss };
}
