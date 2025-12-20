"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "../../../lib/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { normalizePricingTier, type PricingTier } from "./pricingTier";

function isUnknownColumnOrTable(error: any): boolean {
  const code = typeof error?.code === "string" ? error.code : "";
  const message = typeof error?.message === "string" ? error.message : "";
  return (
    code === "42703" ||
    code === "42P01" ||
    message.toLowerCase().includes("does not exist") ||
    message.toLowerCase().includes("column") ||
    message.toLowerCase().includes("relation")
  );
}

export function useViewerTier(): { tier: PricingTier; loading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const [tier, setTier] = useState<PricingTier>("FREE_BASIC");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setTier("FREE_BASIC");
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // 1) User metadata override (fast).
        const metaTier = normalizePricingTier(
          (user as any)?.user_metadata?.subscription_tier ??
            (user as any)?.user_metadata?.tier ??
            (user as any)?.app_metadata?.subscription_tier ??
            (user as any)?.app_metadata?.tier
        );
        if (metaTier !== "FREE_BASIC") {
          if (!cancelled) setTier(metaTier);
          return;
        }

        // 2) Subscription row lookup (read-only, client-side).
        let client: ReturnType<typeof supabaseBrowser> | null = null;
        try {
          client = supabaseBrowser();
        } catch {
          client = null;
        }

        if (!client) {
          if (!cancelled) setTier("FREE_BASIC");
          return;
        }

        // Prefer the canonical `subscriptions` table (Stripe integration).
        const attempt = await client
          .from("subscriptions")
          .select("tier,is_active,status,plan")
          .eq("user_id", user.id)
          .maybeSingle();

        if (attempt.error) {
          // If the table/columns are missing, fail closed to FREE_BASIC.
          if (!isUnknownColumnOrTable(attempt.error)) {
            console.warn("useViewerTier: subscription lookup failed", attempt.error);
          }
          if (!cancelled) setTier("FREE_BASIC");
          return;
        }

        const row: any = attempt.data;
        const isActive =
          Boolean(row?.is_active) ||
          (typeof row?.status === "string" &&
            ["active", "trialing"].includes(row.status.toLowerCase()));

        const rawTier = row?.tier ?? row?.plan ?? null;
        const normalized = isActive ? normalizePricingTier(rawTier) : "FREE_BASIC";
        if (!cancelled) setTier(normalized);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]);

  return { tier, loading };
}

