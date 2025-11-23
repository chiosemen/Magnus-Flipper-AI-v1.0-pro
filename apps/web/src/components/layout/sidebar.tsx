'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Bell,
  Activity,
  Clock,
  Database,
  Cpu,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingCart },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Crawler Status', href: '/crawler', icon: Activity },
  { name: 'Scheduler', href: '/scheduler', icon: Clock },
  { name: 'Redis Queue', href: '/queue', icon: Database },
  { name: 'System Health', href: '/health', icon: Cpu },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/50 bg-surface/95 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border/50 px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-blue to-cyan-mint">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Magnus Flipper</h1>
            <p className="text-xs text-muted-foreground">AI Trading Bot</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg neon-glow'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border/50 p-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-foreground">System Status</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
            <span className="text-xs text-muted-foreground">All Systems Operational</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
