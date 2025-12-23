"use client";

import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { SideNav } from "./SideNav";

interface AppShellProps {
  children: ReactNode;
  /**
   * Whether to show the sidebar
   * @default true
   */
  showSidebar?: boolean;
  /**
   * Custom max width for main content
   * @default "max-w-6xl"
   */
  maxWidth?: string;
  /**
   * Enable fade-in animation for content
   * @default true
   */
  animate?: boolean;
}

export function AppShell({ 
  children, 
  showSidebar = true,
  maxWidth = "max-w-6xl",
  animate = true,
}: AppShellProps) {
  const content = (
    <div className="min-h-screen bg-background text-foreground flex">
      {showSidebar && <SideNav />}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-6 py-6 lg:px-10 lg:py-8">
          <div className={`mx-auto w-full ${maxWidth}`}>{children}</div>
        </main>
      </div>
    </div>
  );

  // Animation removed for simplicity - FadeIn component decoupled
  return content;
}
