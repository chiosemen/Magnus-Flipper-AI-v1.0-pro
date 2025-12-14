"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/admin", icon: "📊" },
  { label: "Marketplaces", href: "/admin/marketplaces", icon: "🏪" },
  { label: "Scanners", href: "/admin/scanners", icon: "🔍" },
  { label: "Jobs", href: "/admin/jobs", icon: "⚙️" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-[#2a2a2a] flex flex-col h-screen fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-[#2a2a2a]">
        <div className="text-xl font-bold text-[#ededed]">Admin Panel</div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                    ${
                      isActive
                        ? "bg-[#1a1a1a] text-[#ededed] font-medium"
                        : "text-[#a0a0a0] hover:text-[#ededed] hover:bg-[#1a1a1a]"
                    }
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-[#2a2a2a]">
        <Link
          href="/free"
          className="flex items-center gap-2 text-sm text-[#a0a0a0] hover:text-[#ededed] transition-colors"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </aside>
  );
}
