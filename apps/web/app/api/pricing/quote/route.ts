import { NextResponse } from "next/server";
import { z } from "zod";
import { inferAppRegionFromRequest, type AppRegion } from "../../../../lib/appRegion";
import { getStripeClient } from "../../../../lib/stripe";
import { STRIPE_PRICE_IDS } from "../../../../lib/stripePrices";
import { createSupabaseServer } from "../../../../lib/supabase/server";

const BodySchema = z.object({
  marketplaces: z.array(z.string()).optional().default([]),
  searches: z.number().int().min(0).max(200).optional().default(0),
  findTime: z
    .enum(["instant", "2m", "3m", "5m", "10m"])
    .optional()
    .default("10m"),
  monitoringWindowHours: z.number().int().min(1).max(24).optional().default(12),
  currency: z.enum(["USD", "GBP"]).optional(),
  region: z.enum(["UK", "US", "ROW"]).optional(),
});

type RecommendationTier = "FREE_BASIC" | "STARTER" | "PRO" | "ELITE";
type PlanKey = "starter" | "pro" | "elite";

function recommendTier(input: {
  marketplaces: string[];
  searches: number;
  findTime: "instant" | "2m" | "3m" | "5m" | "10m";
  monitoringWindowHours: number;
}): RecommendationTier {
  const marketplacesCount = new Set(
    (input.marketplaces || []).map((m) => (typeof m === "string" ? m.trim().toLowerCase() : "")).filter(Boolean)
  ).size;

  if (input.findTime === "instant") return "ELITE";
  if (marketplacesCount >= 3) return "ELITE";
  if (marketplacesCount >= 2) return "PRO";

  if (input.searches >= 30) return "ELITE";
  if (input.searches >= 12) return "PRO";

  if (input.findTime === "2m" || input.findTime === "3m") return "PRO";
  if (input.findTime === "5m") return "STARTER";

  if (input.monitoringWindowHours >= 24) return "PRO";
  if (input.monitoringWindowHours >= 18) return "STARTER";

  return "FREE_BASIC";
}

function tierToPlanKey(tier: RecommendationTier): PlanKey | null {
  if (tier === "STARTER") return "starter";
  if (tier === "PRO") return "pro";
  if (tier === "ELITE") return "elite";
  return null;
}

export async function POST(req: Request) {
  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const requestedRegion: AppRegion | null =
    parsed.data.region === "UK" ? "UK" : parsed.data.region === "US" ? "US" : null;
  let user: any = null;
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser ?? null;
  } catch {
    user = null;
  }

  const inferredRegion: AppRegion = requestedRegion ?? inferAppRegionFromRequest(req, { user });

  // Currency override picks the Stripe price region directly (GBP -> UK prices, USD -> US prices).
  const priceRegion: "UK" | "US" =
    parsed.data.currency === "GBP"
      ? "UK"
      : parsed.data.currency === "USD"
      ? "US"
      : inferredRegion;

  const currency = parsed.data.currency ?? (priceRegion === "UK" ? "GBP" : "USD");
  let prices: Array<{
    planKey: PlanKey;
    priceId: string;
    currency: string;
    unitAmount: number | null;
    interval: string;
  }> = [];

  try {
    const stripe = getStripeClient();
    prices = await Promise.all(
      (["starter", "pro", "elite"] as const).map(async (planKey) => {
        const priceId = STRIPE_PRICE_IDS[priceRegion][planKey];
        const price = await stripe.prices.retrieve(priceId);
        return {
          planKey,
          priceId,
          currency: price.currency?.toUpperCase?.() ?? currency,
          unitAmount: typeof price.unit_amount === "number" ? price.unit_amount : null,
          interval: (price.recurring as any)?.interval ?? "month",
        };
      })
    );
  } catch (error: any) {
    console.error("Stripe quote lookup failed", error);
    return NextResponse.json(
      { error: "Stripe pricing is not configured" },
      { status: 503 }
    );
  }

  const tier = recommendTier({
    marketplaces: parsed.data.marketplaces,
    searches: parsed.data.searches,
    findTime: parsed.data.findTime,
    monitoringWindowHours: parsed.data.monitoringWindowHours,
  });

  const recommendedPlanKey = tierToPlanKey(tier);

  return NextResponse.json({
    region: priceRegion,
    currency,
    inputs: parsed.data,
    recommendation: {
      tier,
      planKey: recommendedPlanKey,
    },
    prices: prices.reduce<Record<string, any>>((acc, row) => {
      acc[row.planKey] = row;
      return acc;
    }, {}),
    trialDays: 7,
  });
}
