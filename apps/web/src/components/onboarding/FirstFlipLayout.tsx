"use client";

import { ReactNode } from "react";

type FirstFlipLayoutProps = {
  children: ReactNode;
};

export function FirstFlipLayout({ children }: FirstFlipLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
