'use client'

import { Search, Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur-xl px-4 sm:px-6 lg:px-8">
      {/* Navigation + Search */}
      <div className="flex flex-1 items-center gap-6">
        <nav className="hidden lg:flex items-center gap-4 text-sm text-muted-foreground">
          <Link className="transition hover:text-foreground" href="/flip/phones">
            Flip Phones
          </Link>
          <Link className="transition hover:text-foreground" href="/flip/cars">
            Flip Cars
          </Link>
          <Link className="transition hover:text-foreground" href="/flip/couches">
            Flip Couches
          </Link>
          <Link className="transition hover:text-foreground" href="/pricing">
            Pricing
          </Link>
          <Link className="transition hover:text-foreground" href="/marketplace">
            Marketplace
          </Link>
        </nav>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search listings, alerts, or searches..."
            className="h-10 w-full rounded-lg border border-border/50 bg-muted/30 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          asChild
        >
          <Link href="/alerts">
            <Bell className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-[20px] rounded-full px-1.5 text-xs"
            >
              3
            </Badge>
          </Link>
        </Button>

        {/* User Profile */}
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 transition-all hover:border-cyan-mint/50 hover:bg-muted/50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-blue to-cyan-mint shadow-md">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium">Admin</p>
            <p className="text-xs text-muted-foreground">Pro Plan</p>
          </div>
        </Link>
      </div>
    </header>
  )
}
