// =====================================================
// EDGE FUNCTION: /auth/on-signup
// Handle new user signup events (email verification, welcome)
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

    // Parse webhook payload
    const payload = await req.json();

    console.log("📨 Received auth event:", payload.type);

    // Handle different auth events
    switch (payload.type) {
      case "user.created":
      case "signup":
        await handleUserCreated(payload.record, supabase);
        break;

      case "user.updated":
        await handleUserUpdated(payload.record, supabase);
        break;

      case "email.verified":
        await handleEmailVerified(payload.record, supabase);
        break;

      default:
        console.log(`Unhandled auth event type: ${payload.type}`);
    }

    return new Response(
      JSON.stringify({ success: true, type: payload.type }),
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
// HELPER FUNCTIONS
// =====================================================

async function handleUserCreated(user: any, supabase: any) {
  console.log("👤 New user created:", user.email);

  // Check if user profile already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existingUser) {
    console.log("✅ User profile already exists");
    return;
  }

  // Create user profile
  const { error: userError } = await supabase.from("users").insert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || null,
    avatar_url: user.user_metadata?.avatar_url || null,
    metadata: user.user_metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (userError) {
    console.error("Error creating user profile:", userError);
    throw userError;
  }

  console.log("✅ User profile created");

  // Create free tier subscription
  const { error: subError } = await supabase.from("subscriptions").insert({
    user_id: user.id,
    tier: "free",
    is_active: true,
    payment_status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (subError) {
    console.error("Error creating subscription:", subError);
    throw subError;
  }

  console.log("✅ Free tier subscription created");

  // Generate welcome API key
  const apiKeyValue = await generateApiKey();
  const keyPrefix = apiKeyValue.substring(0, 12);

  const { error: apiKeyError } = await supabase.from("api_keys").insert({
    user_id: user.id,
    name: "Default API Key",
    value: apiKeyValue,
    key_prefix: keyPrefix,
    scopes: ["read"],
    rate_limit_per_minute: 60,
    is_active: true,
    created_at: new Date().toISOString(),
  });

  if (apiKeyError) {
    console.error("Error creating API key:", apiKeyError);
  } else {
    console.log("✅ Welcome API key created");
  }

  // Send welcome email (optional - integrate with email service)
  await sendWelcomeEmail(user.email, user.user_metadata?.full_name);

  // Log signup event
  const { error: eventError } = await supabase.from("scraper_events").insert({
    user_id: user.id,
    marketplace: "system",
    event_type: "user_signup",
    payload: {
      email: user.email,
      signup_method: user.app_metadata?.provider || "email",
    },
    status: "success",
    created_at: new Date().toISOString(),
  });

  if (eventError) {
    console.error("Error logging signup event:", eventError);
  }

  console.log(`🎉 User ${user.email} onboarded successfully`);
}

async function handleUserUpdated(user: any, supabase: any) {
  console.log("🔄 User updated:", user.email);

  // Update user profile
  const { error: updateError } = await supabase
    .from("users")
    .update({
      email: user.email,
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      metadata: user.user_metadata || {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Error updating user profile:", updateError);
  } else {
    console.log("✅ User profile updated");
  }
}

async function handleEmailVerified(user: any, supabase: any) {
  console.log("✉️ Email verified:", user.email);

  // Update user metadata
  const { error: updateError } = await supabase
    .from("users")
    .update({
      metadata: {
        ...user.user_metadata,
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Error updating email verification:", updateError);
  } else {
    console.log("✅ Email verification recorded");
  }

  // Send email verification confirmation (optional)
  await sendVerificationConfirmationEmail(user.email);
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

async function generateApiKey(): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(
    `${Date.now()}-${Math.random()}-${crypto.randomUUID()}`
  );
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  // Format as sk_live_xxxxx
  return `sk_live_${hashHex.substring(0, 40)}`;
}

async function sendWelcomeEmail(email: string, name: string | null) {
  // TODO: Integrate with email service (Resend, SendGrid, etc.)
  console.log(`📧 Sending welcome email to ${email}...`);

  // Example using Resend
  /*
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: "Magnus Flipper AI <noreply@flipperagents.com>",
      to: email,
      subject: "Welcome to Magnus Flipper AI! 🚀",
      html: `
        <h1>Welcome${name ? ` ${name}` : ""}!</h1>
        <p>Thank you for signing up for Magnus Flipper AI.</p>
        <p>Your account has been created with a free tier subscription.</p>
        <p>You can upgrade to Pro or Agency tier at any time from your dashboard.</p>
        <p><a href="https://flipperagents.com/dashboard">Go to Dashboard →</a></p>
      `,
    }),
  });
  */

  console.log("✅ Welcome email sent (mock)");
}

async function sendVerificationConfirmationEmail(email: string) {
  // TODO: Integrate with email service
  console.log(`📧 Sending verification confirmation to ${email}...`);
  console.log("✅ Verification confirmation sent (mock)");
}
