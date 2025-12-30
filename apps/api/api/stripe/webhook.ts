import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import { z } from 'zod';
import { getServiceSupabaseClient } from '../../lib/supabase';
import {
  findUserByStripeIds,
  getMarketAgentEntitlement,
  resolveMarketAgentAccess,
  updateUserEntitlements,
} from '../../lib/entitlements';

const EnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRICE_MARKET_AGENT: z.string().min(1),
});

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function buildStripeClient(secret: string) {
  return new Stripe(secret, { apiVersion: '2024-11-20.acacia' });
}

function getSignature(req: VercelRequest): string | null {
  const sig = req.headers['stripe-signature'];
  if (!sig) return null;
  return Array.isArray(sig) ? sig[0] : sig;
}

async function recordStripeEvent(params: {
  eventId: string;
  eventType: string;
  eventCreated: number;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status: string;
  message?: string | null;
}) {
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase.from('stripe_webhook_events').insert({
    event_id: params.eventId,
    event_type: params.eventType,
    event_created: params.eventCreated,
    stripe_customer_id: params.stripeCustomerId ?? null,
    stripe_subscription_id: params.stripeSubscriptionId ?? null,
    status: params.status,
    message: params.message ?? null,
    processed_at: params.status === 'processed' ? new Date().toISOString() : null,
  });
  if (error) {
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
      return { inserted: false };
    }
    throw new Error(error.message);
  }
  return { inserted: true };
}

async function updateStripeEventStatus(eventId: string, status: string, message?: string | null) {
  try {
    const supabase = getServiceSupabaseClient();
    await supabase
      .from('stripe_webhook_events')
      .update({
        status,
        message: message ?? null,
        processed_at: status === 'processed' ? new Date().toISOString() : null,
      })
      .eq('event_id', eventId);
  } catch (error) {
    console.error('[stripe webhook] Failed to update event status', {
      eventId,
      status,
      error,
    });
  }
}

async function isOutOfOrderEvent(params: {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  eventCreated: number;
}) {
  const supabase = getServiceSupabaseClient();
  const query = supabase.from('stripe_webhook_events').select('event_created');

  if (params.stripeSubscriptionId) {
    query.eq('stripe_subscription_id', params.stripeSubscriptionId);
  } else if (params.stripeCustomerId) {
    query.eq('stripe_customer_id', params.stripeCustomerId);
  } else {
    return false;
  }

  const { data } = await query.order('event_created', { ascending: false }).limit(1).maybeSingle();
  if (!data?.event_created) return false;
  return params.eventCreated < Number(data.event_created);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = randomUUID();

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed', request_id: requestId });
    return;
  }

  const env = EnvSchema.safeParse(process.env);
  if (!env.success) {
    console.error('[stripe webhook] Missing env', {
      requestId,
      issues: env.error.issues,
    });
    res.status(500).json({ error: 'Stripe env missing', request_id: requestId });
    return;
  }

  const sig = getSignature(req);
  if (!sig) {
    res.status(400).json({ error: 'Missing signature', request_id: requestId });
    return;
  }

  let event: Stripe.Event;
  try {
    const buf = await buffer(req);
    const stripe = buildStripeClient(env.data.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(buf, sig, env.data.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[stripe webhook] Signature verification failed', {
      requestId,
      error: err?.message,
    });
    res.status(400).json({ error: 'Invalid signature', request_id: requestId });
    return;
  }

  const subscription =
    event.type.startsWith('customer.subscription.')
      ? (event.data.object as Stripe.Subscription)
      : null;
  const stripeCustomerId = subscription?.customer ? String(subscription.customer) : null;
  const stripeSubscriptionId = subscription?.id ?? null;

  try {
    const record = await recordStripeEvent({
      eventId: event.id,
      eventType: event.type,
      eventCreated: event.created,
      stripeCustomerId,
      stripeSubscriptionId,
      status: 'received',
    });

    if (!record.inserted) {
      res.status(200).json({ received: true, status: 'duplicate', request_id: requestId });
      return;
    }

    if (
      await isOutOfOrderEvent({
        stripeCustomerId,
        stripeSubscriptionId,
        eventCreated: event.created,
      })
    ) {
      await updateStripeEventStatus(event.id, 'ignored_out_of_order');
      res.status(200).json({ received: true, status: 'out_of_order', request_id: requestId });
      return;
    }

    if (!subscription) {
      await updateStripeEventStatus(event.id, 'ignored_unhandled');
      res.status(200).json({ received: true, status: 'ignored', request_id: requestId });
      return;
    }

    const mapping = await findUserByStripeIds({
      stripeCustomerId,
      stripeSubscriptionId,
    });

    if (!mapping?.userId) {
      await updateStripeEventStatus(event.id, 'ignored_no_user');
      console.error('[stripe webhook] No user mapping for subscription', {
        requestId,
        stripeCustomerId,
        stripeSubscriptionId,
        eventType: event.type,
      });
      res.status(200).json({ received: true, status: 'no_user', request_id: requestId });
      return;
    }

    const entitlement = await getMarketAgentEntitlement(mapping.userId);
    const adminOverride = entitlement.override?.mode ?? null;
    const existingGraceUntil = entitlement.graceUntil;

    const { enabled, status, newGraceUntil } = resolveMarketAgentAccess(
      subscription,
      existingGraceUntil,
      adminOverride,
    );

    await updateUserEntitlements(mapping.userId, {
      marketAgentEnabled: enabled,
      marketAgentStatus: status,
      graceUntil: newGraceUntil,
      stripeCustomerId: stripeCustomerId ?? entitlement.stripeCustomerId ?? null,
      stripeSubscriptionId: stripeSubscriptionId ?? entitlement.stripeSubscriptionId ?? null,
    });

    await updateStripeEventStatus(event.id, 'processed');

    res.status(200).json({
      received: true,
      status: 'processed',
      request_id: requestId,
    });
  } catch (err: any) {
    console.error('[stripe webhook] Handler error', {
      requestId,
      eventId: event.id,
      error: err?.message,
    });
    await updateStripeEventStatus(event.id, 'error', err?.message);
    res.status(500).json({ error: 'Webhook handler failed', request_id: requestId });
  }
}
