// =====================================================
// EDGE FUNCTION: /scores/recalculate
// Recalculate deal scores with updated algorithms
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has required tier (pro, agency, or admin)
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("tier, is_active")
      .eq("user_id", user.id)
      .single();

    if (
      !subscription ||
      !subscription.is_active ||
      !["pro", "agency", "admin"].includes(subscription.tier)
    ) {
      return new Response(
        JSON.stringify({
          error: "Insufficient permissions. Pro tier or higher required.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { deal_ids, marketplace, recalculate_all } = body;

    let query = supabase.from("deal_scores").select("*");

    // Filter by user
    query = query.eq("user_id", user.id);

    // Filter by specific deal IDs
    if (deal_ids && Array.isArray(deal_ids) && deal_ids.length > 0) {
      query = query.in("deal_id", deal_ids);
    }

    // Filter by marketplace
    if (marketplace) {
      query = query.eq("marketplace", marketplace);
    }

    // Get deals to recalculate
    const { data: deals, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching deals:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch deals" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!deals || deals.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          recalculated_count: 0,
          message: "No deals found to recalculate",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🔄 Recalculating ${deals.length} deal scores...`);

    // Recalculate each deal
    const updates = [];

    for (const deal of deals) {
      try {
        const recalculatedScore = await recalculateScore(deal);
        updates.push({
          id: deal.id,
          ...recalculatedScore,
        });
      } catch (error) {
        console.error(`Error recalculating deal ${deal.deal_id}:`, error);
      }
    }

    // Batch update deal scores
    const { error: updateError } = await supabase
      .from("deal_scores")
      .upsert(updates, { onConflict: "id" });

    if (updateError) {
      console.error("Error updating deal scores:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update deal scores" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Recalculated ${updates.length} deal scores`);

    return new Response(
      JSON.stringify({
        success: true,
        recalculated_count: updates.length,
        message: `Successfully recalculated ${updates.length} deal scores`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// =====================================================
// RECALCULATION LOGIC
// =====================================================

async function recalculateScore(deal: any) {
  const startTime = Date.now();

  // Extract existing scores
  const rawScore = deal.raw_score || 0;
  const profitScore = deal.profit_score || 0;
  const riskScore = deal.risk_score || 0;
  const velocityScore = deal.velocity_score || 0;
  const marketScore = deal.market_score || 0;

  // Recalculate adjusted score using weighted algorithm
  const weights = {
    profit: 0.4,
    risk: 0.2,
    velocity: 0.2,
    market: 0.2,
  };

  // Adjust for risk (lower risk = higher score)
  const riskAdjustment = (100 - riskScore) / 100;

  const adjustedScore =
    profitScore * weights.profit +
    riskScore * weights.risk * riskAdjustment +
    velocityScore * weights.velocity +
    marketScore * weights.market;

  // Normalize to 0-100
  const normalizedScore = Math.min(100, Math.max(0, adjustedScore));

  // Calculate confidence level
  let confidenceLevel = "low";
  if (deal.ai_confidence >= 0.8) {
    confidenceLevel = "very_high";
  } else if (deal.ai_confidence >= 0.6) {
    confidenceLevel = "high";
  } else if (deal.ai_confidence >= 0.4) {
    confidenceLevel = "medium";
  }

  const duration = Date.now() - startTime;

  return {
    adjusted_score: Math.round(normalizedScore * 100) / 100,
    confidence_level: confidenceLevel,
    evaluation_duration_ms: duration,
    ai_reasoning: {
      ...deal.ai_reasoning,
      recalculated_at: new Date().toISOString(),
      algorithm_version: "v2.0",
      weights,
    },
  };
}

// =====================================================
// SCORING ALGORITHMS (Advanced)
// =====================================================

function calculateProfitScore(estimatedProfit: number, estimatedROI: number): number {
  // Profit score based on absolute profit and ROI
  const profitWeight = Math.min(100, (estimatedProfit / 100) * 50); // $100 profit = 50 points
  const roiWeight = Math.min(50, estimatedROI); // Cap at 50 points

  return profitWeight + roiWeight;
}

function calculateRiskScore(
  sellerRating: number | null,
  sellerReviews: number | null,
  priceDeviation: number
): number {
  let riskScore = 50; // Start at medium risk

  // Seller reputation
  if (sellerRating) {
    if (sellerRating >= 4.5) riskScore -= 20;
    else if (sellerRating >= 4.0) riskScore -= 10;
    else if (sellerRating < 3.0) riskScore += 20;
  }

  if (sellerReviews) {
    if (sellerReviews >= 100) riskScore -= 10;
    else if (sellerReviews >= 50) riskScore -= 5;
    else if (sellerReviews < 10) riskScore += 10;
  }

  // Price deviation (anomaly detection)
  if (priceDeviation > 2.0) {
    riskScore += 30; // Suspiciously low price
  } else if (priceDeviation > 1.5) {
    riskScore += 15;
  }

  return Math.min(100, Math.max(0, riskScore));
}

function calculateVelocityScore(marketplace: string, category: string): number {
  // Velocity score based on marketplace and category
  // Higher = faster turnover expected

  const marketplaceScores: Record<string, number> = {
    ebay: 80,
    poshmark: 75,
    mercari: 75,
    facebook: 60,
    craigslist: 50,
    offerup: 50,
  };

  return marketplaceScores[marketplace] || 50;
}

function calculateMarketScore(
  marketplace: string,
  competition: number,
  demand: number
): number {
  // Market score based on competition and demand
  const competitionPenalty = Math.min(30, competition / 10);
  const demandBonus = Math.min(50, demand);

  return 70 + demandBonus - competitionPenalty;
}
