import { randomUUID } from 'crypto';
import { getServiceSupabaseClient } from './supabase';

export type BillingEvent = {
  userId: string | null;
  eventType: string;
  status: string;
  intent?: Record<string, any> | null;
  usage?: Record<string, any> | null;
  blockedReason?: string | null;
  metadata?: Record<string, any> | null;
  stripeEventId?: string | null;
};

export async function logBillingEvent(event: BillingEvent) {
  try {
    const supabase = getServiceSupabaseClient();
    const payload = {
      id: randomUUID(),
      user_id: event.userId,
      event_type: event.eventType,
      status: event.status,
      intent: event.intent ?? null,
      usage: event.usage ?? null,
      blocked_reason: event.blockedReason ?? null,
      metadata: event.metadata ?? null,
      stripe_event_id: event.stripeEventId ?? null,
      created_at: new Date().toISOString(),
    };
    await supabase.from('billing_events').insert(payload);
  } catch (error: any) {
    console.warn('[billing_events] insert failed', error?.message || error);
  }
}
