"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, Calculator, BarChart3 } from "lucide-react";
import { cn } from "@magnus-flipper-ai/ui/components";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/deals", label: "Deals", icon: ListChecks },
  { href: "/deals/profit-calculator", label: "Profit Calculator", icon: Calculator },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-surface/60 backdrop-blur supports-[backdrop-filter]:bg-surface/40 lg:block">
      <div className="flex h-full flex-col gap-2 px-4 py-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 px-3">
          Navigate
        </div>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
          {nav.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group inline-flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon 
                  size={18} 
                  className={cn(
                    "transition-colors",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground group-hover:text-primary"
                  )} 
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
