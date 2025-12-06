import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient, getStripeConfig } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { getTierFromPriceId, isActiveSubscription, updateUserSubscriptionTier } from "@/lib/subscription";
import { SubscriptionTier } from "@/types/subscription";
import { checkPayloadSize, PAYLOAD_LIMITS } from "@/lib/security/payload-limit";
import { safeApiRoute } from "@/lib/security/api-error";
import { applySecurityHeaders } from "@/lib/security/headers";

// Webhook uses service role key since it's called by Stripe, not user session
function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  
  return createClient(url, key);
}

function getWebhookSecret(): string {
  const config = getStripeConfig();
  return config.WEBHOOK_SECRET;
}

// Webhook route needs longer timeout for processing Stripe events
export const maxDuration = 60;
export const runtime = 'nodejs';

async function handleWebhook(req: NextRequest) {
  // Check payload size (webhooks have smaller limit)
  const sizeCheck = await checkPayloadSize(req, PAYLOAD_LIMITS.WEBHOOK);
  
  if (!sizeCheck.valid) {
    return NextResponse.json(
      { error: sizeCheck.error },
      { status: 413 }
    );
  }
  
  // Read body as text for Stripe signature verification
  const body = await req.text();
  
  // Double-check size after reading
  if (body.length > PAYLOAD_LIMITS.WEBHOOK) {
    return NextResponse.json(
      { error: `Body exceeds maximum size of ${PAYLOAD_LIMITS.WEBHOOK} bytes` },
      { status: 413 }
    );
  }
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    const webhookSecret = getWebhookSecret();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  console.log(`✅ Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case "customer.created":
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    const response = NextResponse.json({ received: true });
    return applySecurityHeaders(response);
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    const response = NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}

export const POST = safeApiRoute(handleWebhook);

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log("👤 Customer created:", customer.id);

  if (customer.email) {
    const supabase = getSupabaseServiceClient();
    const { error } = await supabase
      .from("users")
      .update({
        metadata: { stripe_customer_id: customer.id },
      })
      .eq("email", customer.email);

    if (error) {
      console.error("Error updating user with customer ID:", error);
    }
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("💳 Checkout completed:", session.id);

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierFromPriceId(priceId);

  const supabase = getSupabaseServiceClient();
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.customer_email)
    .single();

  if (!user) {
    console.error("User not found:", session.customer_email);
    return;
  }

  // Update subscription using helper function
  await updateUserSubscriptionTier(
    user.id,
    tier,
    subscriptionId,
    customerId
  );

  console.log(`✅ Subscription activated: ${tier} tier for ${session.customer_email}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("🔄 Subscription updated:", subscription.id);

  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierFromPriceId(priceId);

  const stripe = getStripeClient();
  // Get customer to find user
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  const customerEmail = typeof customer === "object" && !customer.deleted ? customer.email : null;

  if (!customerEmail) {
    console.error("Customer email not found for subscription:", subscription.id);
    return;
  }

  const supabase = getSupabaseServiceClient();
  // Find user by email
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", customerEmail)
    .single();

  if (!user) {
    console.error("User not found for email:", customerEmail);
    return;
  }

  // Update subscription if active, otherwise set to FREE
  const finalTier = isActiveSubscription(subscription.status) ? tier : SubscriptionTier.FREE;

  await updateUserSubscriptionTier(
    user.id,
    finalTier,
    subscription.id,
    subscription.customer as string
  );

  // Update additional fields in database
  await supabase
    .from("user_subscriptions")
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  console.log(`✅ Subscription updated to ${finalTier} tier`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("❌ Subscription deleted:", subscription.id);

  const stripe = getStripeClient();
  // Get customer to find user
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  const customerEmail = typeof customer === "object" && !customer.deleted ? customer.email : null;

  if (!customerEmail) {
    console.error("Customer email not found for subscription:", subscription.id);
    return;
  }

  const supabase = getSupabaseServiceClient();
  // Find user by email
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", customerEmail)
    .single();

  if (!user) {
    console.error("User not found for email:", customerEmail);
    return;
  }

  // Update subscription to FREE tier
  await updateUserSubscriptionTier(
    user.id,
    SubscriptionTier.FREE,
    undefined,
    subscription.customer as string
  );

  // Update status fields
  await supabase
    .from("user_subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  console.log("✅ User downgraded to free tier");
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("💰 Invoice paid:", invoice.id);

  if (invoice.subscription) {
    const supabase = getSupabaseServiceClient();
    await supabase
      .from("user_subscriptions")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", invoice.subscription as string);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("⚠️ Invoice payment failed:", invoice.id);

  if (invoice.subscription) {
    const supabase = getSupabaseServiceClient();
    await supabase
      .from("user_subscriptions")
      .update({
        status: "past_due",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", invoice.subscription as string);
  }
}

