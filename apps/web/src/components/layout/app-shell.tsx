'use client'

import { SidebarNav } from './sidebar-nav'
import { TopNav } from './top-nav'

interface AppShellProps {
  children: React.ReactNode
}

/**
 * AppShell - Main authenticated app layout wrapper
 * Used by (app) route group for all authenticated pages
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-dark-slate">
      <SidebarNav />
      <div className="lg:pl-64">
        <TopNav />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
