import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getExecutionMode } from "@/lib/runtime/execution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (getExecutionMode() === "off") {
    return new Response("execution disabled", { status: 200 });
  }

  // Marketing-only safe mode
  if (
    !process.env.STRIPE_SECRET_KEY ||
    !process.env.STRIPE_WEBHOOK_SECRET ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  // Only act on completed checkout
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // Idempotency: receipts has UNIQUE(stripe_session_id)
  const scans = Number(session.metadata?.scans ?? 0) || 0;
  const marketplaces = (() => {
    try {
      return JSON.parse(session.metadata?.marketplaces ?? "[]");
    } catch {
      return [];
    }
  })() as string[];
  const durationMinutes = Number(session.metadata?.duration_minutes ?? 0) || null;

  // If you wire real auth: set userId from session.client_reference_id
  // For now, allow 'anon' receipts but don’t grant entitlements unless user_id is a UUID.
  const userId = session.client_reference_id ?? "anon";

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      userId
    );

  // Always write receipt (idempotent)
  const receiptPayload = {
    user_id: isUuid ? userId : null,
    stripe_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : null,
    stripe_customer_id:
      typeof session.customer === "string" ? session.customer : null,
    amount_total: session.amount_total ?? null,
    currency: session.currency ?? null,
    scans: Math.max(scans, 0),
    marketplaces,
    duration_minutes: durationMinutes,
  };

  const { error: receiptErr } = await supabase
    .from("scan_receipts")
    .insert(receiptPayload);

  // If duplicate, ignore
  if (receiptErr && !String(receiptErr.message).toLowerCase().includes("duplicate")) {
    return NextResponse.json({ ok: false, error: "receipt_insert_failed" }, { status: 500 });
  }

  // Only grant entitlements when we have a real user_id
  if (isUuid && scans > 0) {
    const expiresAt =
      durationMinutes && durationMinutes > 0
        ? new Date(Date.now() + durationMinutes * 60_000).toISOString()
        : null;

    const { error: entErr } = await supabase.from("scan_entitlements").insert({
      user_id: userId,
      scans_remaining: scans,
      marketplaces,
      expires_at: expiresAt,
      source: "stripe",
      stripe_customer_id:
        typeof session.customer === "string" ? session.customer : null,
      stripe_session_id: session.id,
    });

    if (entErr) {
      // If you ever add UNIQUE on stripe_session_id here, you can treat duplicates as OK too.
      return NextResponse.json({ ok: false, error: "entitlement_insert_failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
