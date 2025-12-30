"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  locked?: boolean;
  tier?: "free" | "pro" | "agency" | "admin";
}

type UsageSummary = {
  todayCu: number;
  dailyLimitCu: number;
  percentUsed: number;
  tier: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "📊", tier: "admin" }, // Admin-only
  { label: "Deals", href: "/deals", icon: "💎", tier: "free" },
  { label: "Live Feed", href: "/dashboard/feed", icon: "⚡", tier: "free" },
  { label: "Affiliate", href: "/dashboard/affiliate", icon: "🔗", tier: "free" },
  { label: "Compliance", href: "/dashboard/compliance", icon: "🛡️", tier: "free" },
  { label: "Scraper Performance", href: "/dashboard/scraper", icon: "⚙️", tier: "free" },
  { label: "Analytics", href: "/pro/analytics", icon: "📈", tier: "pro", locked: true },
  { label: "Team", href: "/agency", icon: "👥", tier: "agency", locked: true },
  { label: "Settings", href: "/settings", icon: "⚙️" },
  { label: "Admin", href: "/admin", icon: "🔧", tier: "admin" }, // Admin-only
];

/**
 * Sidebar - Main navigation sidebar
 * Uses design tokens: background, surface, border, text-primary, text-secondary, text-muted
 *
 * Navigation items are filtered based on user role:
 * - Admin items (tier: "admin") are HIDDEN for non-admin users
 * - Pro/Agency items are shown as locked for upsell purposes
 */
export function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);

  // Fetch user role from Supabase
  useEffect(() => {
    async function fetchUserRole() {
      try {
        const supabase = supabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const role = (user?.app_metadata?.role as string) || null;
        setUserRole(role);

        if (user?.id) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("plan, is_trial_expired")
            .eq("id", user.id)
            .single();

          if (profileError) {
            console.warn("Failed to fetch user plan:", profileError);
          } else {
            setPlan(profile?.plan ?? null);
            setIsTrialExpired(profile?.is_trial_expired === true);
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
          const url = baseUrl ? `${baseUrl}/api/usage/summary` : "/api/usage/summary";
          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const payload = (await response.json()) as UsageSummary;
            setUsageSummary(payload);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUserRole();
  }, []);

  const isFeatureLocked = (item: NavItem) => {
    if (!item.locked) return false;
    if (userRole === "admin") return false;
    if (plan === "trial" || isTrialExpired) return true;
    return false;
  };

  // Filter navigation items based on user role
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    // No tier requirement - always visible
    if (!item.tier) return true;

    // Free tier - always visible
    if (item.tier === "free") return true;

    // Admin tier - only visible to admin users (completely hidden otherwise)
    if (item.tier === "admin") return userRole === "admin";

    // Pro/Agency tier - show as locked for upsell (but still visible)
    return true;
  });

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col h-screen fixed left-0 top-0 z-sticky">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="text-xl font-heading font-bold text-foreground">Magnus Flipper</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const isLocked = isFeatureLocked(item);

            return (
              <li key={item.href}>
                <Link
                  href={isLocked ? "/upgrade" : item.href}
                  aria-disabled={isLocked}
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
          {usageSummary && (
            <div className="mt-3 space-y-2">
              <div className="text-xs text-text-muted">Today's usage</div>
              <div className="text-[11px] text-text-muted">
                Tracked automatically across all scans.
              </div>
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>
                  {`Today's usage: ${usageSummary.todayCu.toFixed(1)} / ${usageSummary.dailyLimitCu} CU`}
                </span>
                <span>{`${usageSummary.percentUsed.toFixed(0)}%`}</span>
              </div>
              <div className="h-2 rounded-full bg-border">
                <div
                  className={`h-2 rounded-full ${
                    usageSummary.percentUsed > 90
                      ? "bg-red-500"
                      : usageSummary.percentUsed >= 70
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(usageSummary.percentUsed, 100)}%`,
                  }}
                />
              </div>
              {usageSummary.percentUsed >= 100 ? (
                <div className="text-[11px] text-text-muted">
                  Daily usage limit reached. New scans will resume tomorrow.
                </div>
              ) : usageSummary.percentUsed >= 70 ? (
                <div className="text-[11px] text-text-muted">
                  You're approaching today's usage limit. Some scans may be
                  deferred.
                </div>
              ) : null}
            </div>
          )}
          <button className="mt-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs py-2 rounded-md transition-colors">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
}
