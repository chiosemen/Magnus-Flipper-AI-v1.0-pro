import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "../../../../../lib/supabase/server";

const PushSubscriptionSchema = z.object({
  endpoint: z.string().min(10),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

function normalizeSubscriptions(list: unknown): any[] {
  return Array.isArray(list) ? list.filter((v) => v && typeof v === "object") : [];
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = PushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
  }

  const { data: existing, error: loadError } = await supabase
    .from("user_notification_settings")
    .select("push_subscriptions, per_search, email_enabled, quiet_hours_start_minute, quiet_hours_end_minute, quiet_hours_timezone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (loadError) {
    console.error("Failed to load notification settings for push subscribe", loadError);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }

  const current = normalizeSubscriptions(existing?.push_subscriptions);
  const next = [
    parsed.data,
    ...current.filter((sub: any) => sub?.endpoint !== parsed.data.endpoint),
  ].slice(0, 10);

  const { data, error } = await supabase
    .from("user_notification_settings")
    .upsert(
      {
        user_id: user.id,
        push_enabled: true,
        push_subscriptions: next,
        // preserve other fields if row exists
        per_search: existing?.per_search ?? {},
        email_enabled: typeof existing?.email_enabled === "boolean" ? existing.email_enabled : true,
        quiet_hours_start_minute: existing?.quiet_hours_start_minute ?? null,
        quiet_hours_end_minute: existing?.quiet_hours_end_minute ?? null,
        quiet_hours_timezone: existing?.quiet_hours_timezone ?? "UTC",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("user_id, push_enabled, push_subscriptions, updated_at")
    .single();

  if (error) {
    console.error("Failed to save push subscription", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, settings: data });
}

