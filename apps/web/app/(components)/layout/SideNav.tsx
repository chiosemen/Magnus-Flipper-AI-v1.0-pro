"use client";

import Link from "next/link";
import { LayoutDashboard, ListChecks, Calculator, BarChart3 } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/deals", label: "Deals", icon: ListChecks },
  { href: "/deals/profit-calculator", label: "Profit Calculator", icon: Calculator },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function SideNav() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-surface/60 backdrop-blur lg:block">
      <div className="flex flex-col gap-2 px-4 py-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Navigate</div>
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition"
          >
            <item.icon size={16} className="text-muted-foreground group-hover:text-primary" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
