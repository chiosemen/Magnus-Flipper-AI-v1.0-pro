import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[--background] text-[--foreground]">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}
