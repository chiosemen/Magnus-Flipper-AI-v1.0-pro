import { NextRequest, NextResponse } from "next/server";
import { stripe, getPriceIdForTier } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase";
import { createOrRetrieveCustomer } from "@/lib/stripe/stripe-utils";

export async function POST(req: NextRequest) {
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

    // Parse request body
    const { tier } = await req.json();

    if (!tier || !["pro", "agency"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Get price ID for tier
    const priceId = getPriceIdForTier(tier);

    // Get or create Stripe customer
    const customer = await createOrRetrieveCustomer({
      email: user.email!,
      userId: user.id,
    });
    const customerId = customer.id;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        tier,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
