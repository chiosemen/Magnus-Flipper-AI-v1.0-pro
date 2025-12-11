"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b border-border/60 bg-surface/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-lg font-semibold text-primary">
            Magnus Flipper
          </Link>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">AI</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <button className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 hover:bg-muted/80 transition">
            <Search size={16} />
            Quick search
          </button>
          <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition">
            <Bell size={16} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
          </button>
          <div className="flex h-9 items-center gap-2 rounded-full border border-border/80 bg-background px-3">
            <div className="h-6 w-6 rounded-full bg-primary/20" />
            <span className="text-foreground/90 text-sm font-medium">You</span>
          </div>
        </div>
      </div>
    </header>
  );
}
