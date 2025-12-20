import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { detectRegion, type Region } from "../../../../lib/region";
import { getStripeClient } from "../../../../lib/stripe";
import { STRIPE_PRICE_IDS } from "../../../../lib/stripePrices";
import { createOrRetrieveCustomer } from "../../../../lib/stripe/stripe-utils";
import { createSupabaseServer } from "../../../../lib/supabase/server";

/**
 * Region-aware Stripe Checkout Session creation.
 *
 * Guardrails:
 * - Never compute/convert currency amounts in-app.
 * - Always select a Stripe Price ID by region (`apps/web/lib/stripePrices.ts`).
 * - Keep display pricing (`apps/web/lib/pricing.ts` / Pricing page) separate from checkout logic.
 * - Do not persist per-user pricing decisions (no user/profile mutation for pricing).
 */
type PlanKey = "starter" | "pro" | "elite";

function normalizePlan(value: unknown): PlanKey | null {
  if (typeof value !== "string") return null;
  const plan = value.trim().toLowerCase();
  if (plan === "starter") return "starter";
  if (plan === "pro") return "pro";
  if (plan === "elite") return "elite";
  // NOTE: The UI may label the "elite" plan as "Agency"; keep a single Stripe Product/plan.
  if (plan === "agency") return "elite";
  return null;
}

function regionFromBillingCountry(value: unknown): Region | null {
  if (typeof value !== "string") return null;
  const country = value.trim().toUpperCase();

  if (country === "GB" || country === "UK" || country === "UNITED KINGDOM") return "UK";
  if (country === "US" || country === "USA" || country === "UNITED STATES") return "US";

  return null;
}

function getCustomerBillingCountry(customer: Stripe.Customer): string | null {
  const fromAddress = customer.address?.country;
  const fromShipping = customer.shipping?.address?.country;
  const value = fromAddress || fromShipping;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function safeMetaValue(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.slice(0, 500) : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return null;
}

function addMetadata(
  target: Record<string, string>,
  key: string,
  value: unknown
) {
  const v = safeMetaValue(value);
  if (v !== null) target[key] = v;
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const plan =
    normalizePlan(body.plan) || normalizePlan(body.planKey) || normalizePlan(body.tier);

  if (!plan) {
    return NextResponse.json(
      { error: "Missing or invalid plan" },
      { status: 400 }
    );
  }

  let detectedRegion: Region = "ROW";
  try {
    detectedRegion = detectRegion({ url: req.url, headers: req.headers });
  } catch {
    detectedRegion = "ROW";
  }

  let user: { id: string; email?: string | null } | null = null;
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser?.id) {
      user = { id: authUser.id, email: authUser.email };
    }
  } catch (error) {
    console.warn("Supabase user lookup failed; continuing as anonymous", error);
  }

  let billingCountry: string | null = null;
  let billingRegion: Region | null = null;
  let customer: Stripe.Customer | null = null;

  try {
    if (user?.email) {
      customer = await createOrRetrieveCustomer({
        email: user.email,
        userId: user.id,
      });

      billingCountry = getCustomerBillingCountry(customer);
      billingRegion = regionFromBillingCountry(billingCountry);
    }

    const regionToUse = billingRegion ?? detectedRegion;
    const priceRegion = regionToUse === "UK" || regionToUse === "US" ? regionToUse : "US";

    if (priceRegion !== regionToUse) {
      console.warn("Unknown region for Stripe pricing; falling back to US", {
        userId: user?.id,
        detectedRegion,
        billingCountry,
        billingRegion,
        fallbackRegion: priceRegion,
      });
    }

    const priceId = STRIPE_PRICE_IDS[priceRegion][plan];

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const stripe = getStripeClient();
    const trialDaysRaw = typeof body.trialDays === "number" ? body.trialDays : Number(body.trialDays);
    const trialDays =
      Number.isFinite(trialDaysRaw) && trialDaysRaw > 0
        ? Math.max(1, Math.min(30, Math.floor(trialDaysRaw)))
        : 7;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: new URL("/pricing?checkout=success", baseUrl).toString(),
      cancel_url: new URL("/pricing?checkout=canceled", baseUrl).toString(),
      metadata: {
        plan,
        region: priceRegion,
        detected_region: detectedRegion,
        billing_country: billingCountry ?? "",
      },
      subscription_data: {
        trial_period_days: trialDays,
      },
    };

    // Persist optional pricing-calculator context (no pricing math here; metadata only).
    if (body && typeof body === "object" && body.calculator && typeof body.calculator === "object") {
      const calc = body.calculator as any;
      addMetadata(sessionParams.metadata as any, "calc_marketplaces", Array.isArray(calc.marketplaces) ? calc.marketplaces.join(",") : calc.marketplaces);
      addMetadata(sessionParams.metadata as any, "calc_searches", calc.searches);
      addMetadata(sessionParams.metadata as any, "calc_find_time", calc.findTime);
      addMetadata(sessionParams.metadata as any, "calc_window_hours", calc.monitoringWindowHours);
      addMetadata(sessionParams.metadata as any, "calc_currency", calc.currency);
    }
    addMetadata(sessionParams.metadata as any, "source", body?.source);

    if (user?.id) {
      sessionParams.client_reference_id = user.id;
      sessionParams.metadata = {
        ...sessionParams.metadata,
        user_id: user.id,
      };
    }

    if (customer?.id) {
      sessionParams.customer = customer.id;
    } else {
      const email =
        (typeof body.email === "string" && body.email.trim()
          ? body.email.trim()
          : null) || user?.email || null;

      if (email) {
        sessionParams.customer_email = email;
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create Stripe checkout session", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
