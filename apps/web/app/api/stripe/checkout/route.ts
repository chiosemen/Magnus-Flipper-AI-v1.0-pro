import { NextRequest, NextResponse } from "next/server";
import { stripe, getPriceIdForTier } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase";
import { createOrRetrieveCustomer } from "@/lib/stripe/stripe-utils";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier } = await request.json();

    if (!tier || (tier.toLowerCase() !== "pro" && tier.toLowerCase() !== "agency")) {
      return NextResponse.json(
        { error: "Invalid tier. Must be 'pro' or 'agency'" },
        { status: 400 }
      );
    }

    const priceId = getPriceIdForTier(tier);
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Get or create Stripe customer
    const customer = await createOrRetrieveCustomer({
      email: user.email!,
      userId: user.id,
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        tier,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
