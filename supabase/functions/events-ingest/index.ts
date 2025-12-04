// =====================================================
// EDGE FUNCTION: /events/ingest
// Ingest marketplace scraper events with rate limiting
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
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
    const apiKeyHeader = req.headers.get("x-api-key");

    let userId: string | null = null;

    // Check if user is authenticated via JWT
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = user.id;
    }
    // Check if API key is provided
    else if (apiKeyHeader) {
      // Validate API key
      const { data: apiKey, error: apiKeyError } = await supabase
        .from("api_keys")
        .select("user_id, is_active, expires_at, rate_limit_per_minute")
        .eq("value", apiKeyHeader)
        .single();

      if (apiKeyError || !apiKey) {
        return new Response(
          JSON.stringify({ error: "Invalid API key" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!apiKey.is_active) {
        return new Response(
          JSON.stringify({ error: "API key is inactive" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "API key has expired" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check rate limit
      const { data: rateLimitCheck } = await supabase.rpc("check_rate_limit", {
        p_api_key: apiKeyHeader,
      });

      if (!rateLimitCheck) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = apiKey.user_id;
    } else {
      return new Response(
        JSON.stringify({ error: "No authentication provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();

    const {
      marketplace,
      event_type,
      payload,
      duration_ms,
      items_scraped,
      status,
      error_message,
    } = body;

    // Validate required fields
    if (!marketplace || !event_type || !payload) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: marketplace, event_type, payload",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate marketplace
    const validMarketplaces = [
      "ebay",
      "facebook",
      "craigslist",
      "vinted",
      "depop",
      "gumtree",
      "offerup",
      "mercari",
      "poshmark",
    ];

    if (!validMarketplaces.includes(marketplace)) {
      return new Response(
        JSON.stringify({ error: "Invalid marketplace" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate event type
    const validEventTypes = [
      "scrape_started",
      "scrape_completed",
      "scrape_failed",
      "listing_found",
      "deal_identified",
    ];

    if (!validEventTypes.includes(event_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid event_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get IP and User-Agent
    const ip_address = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
    const user_agent = req.headers.get("user-agent");

    // Insert scraper event
    const { data: event, error: insertError } = await supabase
      .from("scraper_events")
      .insert({
        user_id: userId,
        marketplace,
        event_type,
        payload,
        ip_address,
        user_agent,
        duration_ms: duration_ms || null,
        items_scraped: items_scraped || null,
        status: status || "success",
        error_message: error_message || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting scraper event:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to insert event" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log API usage
    if (apiKeyHeader) {
      await supabase.from("usage_logs").insert({
        user_id: userId,
        endpoint: "/events/ingest",
        method: req.method,
        status_code: 200,
        ip_address,
        user_agent,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        event_id: event.id,
        message: "Event ingested successfully",
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
