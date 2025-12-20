import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "../../../../../lib/supabase/server";

const BodySchema = z.object({
  endpoint: z.string().min(10),
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

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data: existing, error: loadError } = await supabase
    .from("user_notification_settings")
    .select("push_subscriptions, push_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (loadError) {
    console.error("Failed to load notification settings for push unsubscribe", loadError);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }

  const current = normalizeSubscriptions(existing?.push_subscriptions);
  const next = current.filter((sub: any) => sub?.endpoint !== parsed.data.endpoint);

  const shouldDisable = next.length === 0;

  const { data, error } = await supabase
    .from("user_notification_settings")
    .upsert(
      {
        user_id: user.id,
        push_enabled: shouldDisable ? false : Boolean(existing?.push_enabled),
        push_subscriptions: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("user_id, push_enabled, push_subscriptions, updated_at")
    .single();

  if (error) {
    console.error("Failed to remove push subscription", error);
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, settings: data });
}

