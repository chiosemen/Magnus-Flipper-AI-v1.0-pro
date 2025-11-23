'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  Bell,
  Activity,
  Calendar,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Scanner', href: '/scanner', icon: Search },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Crawler', href: '/crawler', icon: Activity },
  { name: 'Scheduler', href: '/scheduler', icon: Calendar },
  { name: 'Queue', href: '/queue', icon: Database },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-primary">Magnus Flipper AI</span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-primary text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-xs text-gray-500">
                API: {process.env.NEXT_PUBLIC_API_URL || 'localhost:4000'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
