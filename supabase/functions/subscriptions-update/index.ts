// =====================================================
// EDGE FUNCTION: /subscriptions/update
// Update user subscription tier (Stripe webhook handler)
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.11.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify webhook signature
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET")!
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📨 Received Stripe event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, supabase);
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription, supabase);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, supabase);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice, supabase);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice, supabase);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true, event_type: event.type }),
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

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  console.log("✅ Checkout completed:", session.id);

  // Get user by email
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.customer_email)
    .single();

  if (userError || !user) {
    console.error("User not found:", session.customer_email);
    return;
  }

  // Determine tier from metadata or price
  const tier = session.metadata?.tier || "pro";

  // Update or insert subscription
  const { error: subError } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: user.id,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      tier,
      is_active: true,
      payment_status: "active",
      current_period_start: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (subError) {
    console.error("Error updating subscription:", subError);
  } else {
    console.log(`✅ Subscription activated for user ${user.id} - ${tier} tier`);
  }
}

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log("✅ Subscription created:", subscription.id);

  // Get user by Stripe customer ID
  const { data: existingSub, error: fetchError } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", subscription.customer)
    .single();

  if (fetchError) {
    console.error("Error fetching subscription:", fetchError);
    return;
  }

  // Determine tier from metadata
  const tier = subscription.metadata?.tier || "pro";

  // Update subscription
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price.id,
      tier,
      is_active: subscription.status === "active" || subscription.status === "trialing",
      payment_status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", subscription.customer);

  if (updateError) {
    console.error("Error updating subscription:", updateError);
  } else {
    console.log(`✅ Subscription ${subscription.id} created - ${tier} tier`);
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log("🔄 Subscription updated:", subscription.id);

  // Determine tier from metadata
  const tier = subscription.metadata?.tier || "pro";

  // Update subscription
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      tier,
      is_active: subscription.status === "active" || subscription.status === "trialing",
      payment_status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (updateError) {
    console.error("Error updating subscription:", updateError);
  } else {
    console.log(`✅ Subscription ${subscription.id} updated - ${tier} tier`);
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log("❌ Subscription deleted:", subscription.id);

  // Downgrade to free tier
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      tier: "free",
      is_active: false,
      payment_status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (updateError) {
    console.error("Error downgrading subscription:", updateError);
  } else {
    console.log(`✅ Subscription ${subscription.id} downgraded to free tier`);
  }
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  console.log("💰 Invoice payment succeeded:", invoice.id);

  if (!invoice.subscription) {
    return;
  }

  // Update payment status
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      payment_status: "active",
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", invoice.subscription);

  if (updateError) {
    console.error("Error updating payment status:", updateError);
  } else {
    console.log(`✅ Payment status updated for subscription ${invoice.subscription}`);
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  console.log("⚠️ Invoice payment failed:", invoice.id);

  if (!invoice.subscription) {
    return;
  }

  // Update payment status
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      payment_status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", invoice.subscription);

  if (updateError) {
    console.error("Error updating payment status:", updateError);
  } else {
    console.log(`⚠️ Payment status set to past_due for subscription ${invoice.subscription}`);
  }
}
