/**
 * Supabase Edge Function: Stripe Webhook Handler
 * Handles Stripe payment events for subscription management
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

serve(async (req) => {
  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`Processing event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }
});

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error("No user_id in session metadata");
    return;
  }

  // Update user's subscription status
  const { error } = await supabase
    .from("user_subscriptions")
    .upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Error updating subscription:", error);
  }
}

async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription
): Promise<void> {
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: subscription.status,
      current_period_start: new Date(
        subscription.current_period_start * 1000
      ).toISOString(),
      current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Error updating subscription:", error);
  }
}

async function handleSubscriptionCanceled(
  subscription: Stripe.Subscription
): Promise<void> {
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Error canceling subscription:", error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  // Log successful payment
  await supabase.from("payment_history").insert({
    stripe_invoice_id: invoice.id,
    stripe_customer_id: invoice.customer as string,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: "succeeded",
    paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  // Log failed payment and potentially notify user
  await supabase.from("payment_history").insert({
    stripe_invoice_id: invoice.id,
    stripe_customer_id: invoice.customer as string,
    amount: invoice.amount_due / 100,
    currency: invoice.currency,
    status: "failed",
    failed_at: new Date().toISOString(),
  });

  // Update subscription status to past_due
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", invoice.customer as string);

  if (error) {
    console.error("Error updating subscription status:", error);
  }
}
