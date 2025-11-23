'use client'

import { Sidebar } from './sidebar'
import { TopBar } from './topbar'

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-slate">
      <Sidebar />
      <div className="ml-64">
        <TopBar />
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}
