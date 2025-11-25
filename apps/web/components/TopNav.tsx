"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TopNav() {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-6 py-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Input
              placeholder="Search listings or alerts..."
              className="pl-10 bg-slate-900/80 border-border/60"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild className={cn(isDashboard && "hidden md:inline-flex")}>
            <Link href="/searches/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Search
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/alerts">
              <Bell className="h-5 w-5" />
            </Link>
          </Button>
          <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-slate-900/80 px-3 py-1 text-xs text-muted-foreground md:inline-flex">
            Live
          </div>
        </div>
      </div>
    </header>
  );
}
