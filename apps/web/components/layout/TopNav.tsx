"use client";

import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";

/**
 * TopNav - Top navigation bar
 * Uses design tokens: background, border, text-primary, surface, surfaceSubtle
 */
export function TopNav() {
  const { user, isAuthenticated, signOut } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-8 ml-64">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-heading font-bold text-foreground">
          Magnus Flipper AI
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="px-4 py-2 bg-surfaceSubtle border border-border rounded-md text-sm text-foreground hover:border-borderLight transition-colors">
          Notifications
        </button>
        {isAuthenticated ? (
          <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background px-3 py-1.5 text-sm text-foreground">
            <div className="h-7 w-7 rounded-full bg-gradient-brand-combined" />
            <span className="max-w-[140px] truncate">
              {user?.email ?? "Signed in"}
            </span>
            <button
              onClick={() => signOut()}
              className="text-xs font-semibold text-red-500 hover:text-red-400"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-foreground hover:text-foreground/80"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
