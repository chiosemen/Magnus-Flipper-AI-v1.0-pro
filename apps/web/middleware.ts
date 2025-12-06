import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SubscriptionTier, TIER_HIERARCHY } from "@/types/subscription";
import { createServerClient } from "@supabase/ssr";
import { getTierFromPriceId, isActiveSubscription } from "@/lib/subscription";

async function getUserTierFromDatabase(request: NextRequest): Promise<{
  tier: SubscriptionTier;
  user: any;
  isAdmin: boolean;
} | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Check for admin role in user metadata
  const isAdmin = user.user_metadata?.role === "admin" || user.user_metadata?.tier === SubscriptionTier.ADMIN;

  // If admin, return admin tier
  if (isAdmin) {
    return {
      tier: SubscriptionTier.ADMIN,
      user,
      isAdmin: true,
    };
  }

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!subscription || !isActiveSubscription(subscription.status)) {
    return {
      tier: SubscriptionTier.FREE,
      user,
      isAdmin: false,
    };
  }

  return {
    tier: getTierFromPriceId(subscription.stripe_price_id),
    user,
    isAdmin: false,
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, API routes, and public pages
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/upgrade") ||
    pathname === "/" ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Protect dashboard and admin routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    const userData = await getUserTierFromDatabase(request);

    // Block unauthenticated users
    if (!userData) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    const { tier, isAdmin } = userData;

    // Admin routes require ADMIN tier or admin role
    if (pathname.startsWith("/admin")) {
      if (tier !== SubscriptionTier.ADMIN && !isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/pricing";
        url.searchParams.set("tier", SubscriptionTier.ADMIN);
        return NextResponse.redirect(url);
      }
    }

    // Dashboard routes require at least PRO tier (or admin)
    if (pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/admin")) {
      const userTierLevel = TIER_HIERARCHY[tier] || 0;
      const requiredTierLevel = TIER_HIERARCHY[SubscriptionTier.PRO];

      if (userTierLevel < requiredTierLevel && !isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/pricing";
        url.searchParams.set("tier", SubscriptionTier.PRO);
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};
