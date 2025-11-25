"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Bell,
  LayoutDashboard,
  ListChecks,
  Search,
  Settings,
  Target,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Saved Searches", href: "/searches", icon: Target },
  { label: "Results", href: "/listing", icon: Search },
  { label: "Alerts", href: "/alerts", icon: Bell },
  { label: "Tasks", href: "/tasks", icon: ListChecks },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 border-r border-border/40 bg-slate-950/70 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-border/40 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-white">
          MF
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Magnus Flipper</p>
          <p className="text-xs text-muted-foreground">Marketplace Monitor</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-cyan-500/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.label === "Alerts" && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  Live
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
