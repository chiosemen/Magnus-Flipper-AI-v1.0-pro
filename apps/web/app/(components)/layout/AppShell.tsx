"use client";

import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { SideNav } from "./SideNav";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SideNav />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 px-6 py-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
