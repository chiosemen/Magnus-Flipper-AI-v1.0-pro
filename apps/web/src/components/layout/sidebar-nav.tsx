'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  Bell,
  CreditCard,
  Settings,
  TrendingUp,
  Sparkles,
  Activity,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Saved Searches', href: '/searches', icon: Search },
  { name: 'Alerts', href: '/alerts', icon: Bell, badge: 3 },
  { name: 'Alerts Radar', href: '/alerts-anomaly', icon: Activity },
  { name: 'Profit Heatmap', href: '/crawler-profitability', icon: Target },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border/50 bg-surface/95 backdrop-blur-xl lg:block">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border/50 px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-blue to-cyan-mint shadow-lg">
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
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg neon-glow'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                {item.name}
              </div>
              {item.badge && (
                <Badge
                  variant={isActive ? 'secondary' : 'outline'}
                  className="h-5 min-w-[20px] px-1.5"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer - System Status */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border/50 p-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-foreground">System Status</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </div>
            <span className="text-xs text-muted-foreground">All Systems Operational</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
