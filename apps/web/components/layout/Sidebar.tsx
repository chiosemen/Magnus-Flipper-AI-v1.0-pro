import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const nav = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Saved Searches', href: '/searches' },
  { label: 'Results', href: '/results' },
  { label: 'Alerts', href: '/alerts' },
  { label: 'Plan', href: '/plan' },
  { label: 'Settings', href: '/settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-64 border-r border-[--border] bg-[--surface]">
      <div className="flex h-16 items-center px-6 text-lg font-semibold">Magnus Flipper</div>
      <nav className="space-y-1 px-4">
        {nav.map((item) => {
          const active = pathname?.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition',
                active
                  ? 'bg-[--accent-blue]/10 text-[--accent-blue]'
                  : 'text-[--muted-foreground] hover:bg-[--muted]'
              )}
            >
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
