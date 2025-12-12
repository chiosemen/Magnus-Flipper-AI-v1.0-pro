"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  locked?: boolean;
  tier?: "free" | "pro" | "agency" | "admin";
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "📊", tier: "free" },
  { label: "Deals", href: "/deals", icon: "💎", tier: "free" },
  { label: "Live Feed", href: "/dashboard/feed", icon: "⚡", tier: "free" },
  { label: "Affiliate", href: "/dashboard/affiliate", icon: "🔗", tier: "free" },
  { label: "Compliance", href: "/dashboard/compliance", icon: "🛡️", tier: "free" },
  { label: "Scraper Performance", href: "/dashboard/scraper", icon: "⚙️", tier: "free" },
  { label: "Analytics", href: "/pro/analytics", icon: "📈", tier: "pro", locked: true },
  { label: "Team", href: "/agency", icon: "👥", tier: "agency", locked: true },
  { label: "Settings", href: "/settings", icon: "⚙️" },
  { label: "Admin", href: "/admin", icon: "🔧", tier: "admin", locked: true },
];

/**
 * Sidebar - Main navigation sidebar
 * Uses design tokens: background, surface, border, text-primary, text-secondary, text-muted
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col h-screen fixed left-0 top-0 z-sticky">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="text-xl font-heading font-bold text-foreground">Magnus Flipper</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const isLocked = item.locked;

            return (
              <li key={item.href}>
                <Link
                  href={isLocked ? "#" : item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                    ${
                      isActive
                        ? "bg-surfaceSubtle text-foreground font-medium"
                        : "text-text-secondary hover:text-foreground hover:bg-surfaceSubtle"
                    }
                    ${isLocked ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {isLocked && <span className="text-xs">🔒</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Tier Badge */}
      <div className="p-4 border-t border-border">
        <div className="bg-surfaceSubtle rounded-lg p-3">
          <div className="text-xs text-text-muted mb-1">Current Plan</div>
          <div className="text-sm font-bold text-foreground">Free Tier</div>
          <button className="mt-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs py-2 rounded-md transition-colors">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
}
