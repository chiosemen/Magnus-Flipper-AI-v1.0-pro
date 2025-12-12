"use client";

import { Bell, Search, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@magnus-flipper-ai/ui/providers";
import { Button } from "@magnus-flipper-ai/ui/components";

export function Navbar() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-sticky border-b border-border/60 bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3 lg:px-8">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard" 
            className="text-lg font-heading font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Magnus Flipper
          </Link>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            AI
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button 
            className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 hover:bg-muted/80 transition-colors"
            aria-label="Quick search"
          >
            <Search size={16} />
            <span className="hidden sm:inline">Quick search</span>
          </button>
          <button 
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-surface" />
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
            className="h-9 w-9"
          >
            {resolvedTheme === "dark" ? (
              <Sun size={16} className="transition-transform hover:rotate-12" />
            ) : (
              <Moon size={16} className="transition-transform hover:-rotate-12" />
            )}
          </Button>
          <div className="flex h-9 items-center gap-2 rounded-full border border-border/80 bg-background px-3">
            <div className="h-6 w-6 rounded-full bg-gradient-primary" />
            <span className="text-foreground/90 text-sm font-medium">You</span>
          </div>
        </div>
      </div>
    </header>
  );
}
