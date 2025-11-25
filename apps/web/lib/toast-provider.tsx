"use client";

import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
