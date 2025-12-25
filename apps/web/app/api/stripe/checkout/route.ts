import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUser } from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/auth/admin-guard';
import { canExecute } from '@/lib/runtime/execution';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, reason: 'not_authenticated' },
      { status: 401 }
    );
  }

  const adminProfile = await checkIsAdmin();
  const userRole =
    adminProfile?.role ||
    (user.app_metadata?.role as string | undefined) ||
    (user.user_metadata?.role as string | undefined);

  if (!canExecute(userRole)) {
    return NextResponse.json(
      { ok: false, reason: 'execution_not_allowed' },
      { status: 200 }
    );
  }

  // --- ENV GUARDS (marketing-safe) ---
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { ok: false, reason: 'stripe_disabled' },
      { status: 200 }
    );
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    return NextResponse.json(
      { ok: false, reason: 'app_url_missing' },
      { status: 200 }
    );
  }

  const body = await req.json();
  const { priceId, source = 'pricing' } = body;

  if (!priceId) {
    return NextResponse.json(
      { ok: false, reason: 'missing_price_id' },
      { status: 400 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pricing`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: user.id,
    metadata: {
      source,
    },
  });

  return NextResponse.json({
    ok: true,
    checkout_url: session.url,
  });
}
