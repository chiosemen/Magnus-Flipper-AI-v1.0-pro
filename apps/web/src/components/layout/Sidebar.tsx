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
  { label: "Dashboard", href: "/free", icon: "📊", tier: "free" },
  { label: "Live Feed", href: "/pro", icon: "⚡", tier: "pro", locked: true },
  { label: "Analytics", href: "/pro/analytics", icon: "📈", tier: "pro", locked: true },
  { label: "Team", href: "/agency", icon: "👥", tier: "agency", locked: true },
  { label: "Settings", href: "/settings", icon: "⚙️" },
  { label: "Admin", href: "/admin", icon: "🔧", tier: "admin", locked: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-[#2a2a2a] flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#2a2a2a]">
        <div className="text-xl font-bold text-[#ededed]">Magnus Flipper</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const isLocked = item.locked;

            return (
              <li key={item.href}>
                <Link
                  href={isLocked ? "#" : item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                    ${
                      isActive
                        ? "bg-[#1a1a1a] text-[#ededed] font-medium"
                        : "text-[#a0a0a0] hover:text-[#ededed] hover:bg-[#1a1a1a]"
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
      <div className="p-4 border-t border-[#2a2a2a]">
        <div className="bg-[#1a1a1a] rounded-lg p-3">
          <div className="text-xs text-[#a0a0a0] mb-1">Current Plan</div>
          <div className="text-sm font-bold text-[#ededed]">Free Tier</div>
          <button className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded-md transition-colors">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
}
