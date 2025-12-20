import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "../../../../lib/supabase/server";

const QuietHoursSchema = z
  .object({
    startMinute: z.number().int().min(0).max(1439).nullable().optional(),
    endMinute: z.number().int().min(0).max(1439).nullable().optional(),
    timezone: z.string().min(1).max(64).nullable().optional(),
  })
  .optional();

const UpdateSettingsSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  quietHours: QuietHoursSchema,
  perSearch: z.record(z.any()).optional(),
});

function normalizeMinute(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const int = Math.floor(value);
  if (int < 0 || int > 1439) return null;
  return int;
}

function safeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_notification_settings")
    .select(
      "user_id, push_enabled, email_enabled, quiet_hours_start_minute, quiet_hours_end_minute, quiet_hours_timezone, per_search, push_subscriptions, updated_at"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load notification settings", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({
      settings: {
        user_id: user.id,
        push_enabled: false,
        email_enabled: true,
        quiet_hours_start_minute: null,
        quiet_hours_end_minute: null,
        quiet_hours_timezone: "UTC",
        per_search: {},
        push_subscriptions: [],
        updated_at: null,
      },
    });
  }

  return NextResponse.json({ settings: data });
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = UpdateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
  }

  const quiet = parsed.data.quietHours ?? {};

  const update: Record<string, any> = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  if (typeof parsed.data.pushEnabled === "boolean") {
    update.push_enabled = parsed.data.pushEnabled;
  }
  if (typeof parsed.data.emailEnabled === "boolean") {
    update.email_enabled = parsed.data.emailEnabled;
  }

  if ("startMinute" in quiet) {
    update.quiet_hours_start_minute = normalizeMinute((quiet as any).startMinute);
  }
  if ("endMinute" in quiet) {
    update.quiet_hours_end_minute = normalizeMinute((quiet as any).endMinute);
  }
  if ("timezone" in quiet) {
    update.quiet_hours_timezone = safeText((quiet as any).timezone) ?? null;
  }

  if (parsed.data.perSearch && typeof parsed.data.perSearch === "object") {
    update.per_search = parsed.data.perSearch;
  }

  const { data, error } = await supabase
    .from("user_notification_settings")
    .upsert(update, { onConflict: "user_id" })
    .select(
      "user_id, push_enabled, email_enabled, quiet_hours_start_minute, quiet_hours_end_minute, quiet_hours_timezone, per_search, push_subscriptions, updated_at"
    )
    .single();

  if (error) {
    console.error("Failed to update notification settings", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}

