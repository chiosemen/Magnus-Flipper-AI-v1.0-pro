import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "../../../lib/supabase/server";
import { supabaseAdmin } from "../../../lib/supabase/admin";

const BlockTypeSchema = z.enum(["seller", "location", "keyword"]);

const CreateSchema = z.object({
  marketplace: z.string().min(1),
  type: BlockTypeSchema,
  value: z.string().min(1).max(200),
});

const DeleteSchema = z.object({
  id: z.string().uuid(),
});

function isUniqueViolation(error: any): boolean {
  return typeof error?.code === "string" && error.code === "23505";
}

async function requireUserId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  let supabase: ReturnType<typeof supabaseAdmin> | null = null;
  try {
    supabase = supabaseAdmin();
  } catch (error) {
    console.error("Supabase unavailable", error);
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const marketplace = (searchParams.get("marketplace") || "").trim().toLowerCase();

  let query = supabase
    .from("user_blocks")
    .select("id, marketplace, type, value, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (marketplace) {
    query = query.eq("marketplace", marketplace);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to load user blocks", error);
    return NextResponse.json({ error: "Failed to load blocks" }, { status: 500 });
  }

  return NextResponse.json({ blocks: Array.isArray(data) ? data : [] });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  let supabase: ReturnType<typeof supabaseAdmin> | null = null;
  try {
    supabase = supabaseAdmin();
  } catch (error) {
    console.error("Supabase unavailable", error);
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  }

  const payload = {
    user_id: userId,
    marketplace: parsed.data.marketplace.trim().toLowerCase(),
    type: parsed.data.type,
    value: parsed.data.value.trim(),
  };

  const insert = await supabase
    .from("user_blocks")
    .insert(payload)
    .select("id, marketplace, type, value, created_at")
    .single();

  if (insert.error) {
    if (isUniqueViolation(insert.error)) {
      const existing = await supabase
        .from("user_blocks")
        .select("id, marketplace, type, value, created_at")
        .eq("user_id", userId)
        .eq("marketplace", payload.marketplace)
        .eq("type", payload.type)
        .eq("value", payload.value)
        .maybeSingle();
      if (existing.error) {
        return NextResponse.json({ error: "Failed to save block" }, { status: 500 });
      }
      return NextResponse.json({ block: existing.data ?? null }, { status: 201 });
    }
    console.error("Failed to create user block", insert.error);
    return NextResponse.json({ error: "Failed to save block" }, { status: 500 });
  }

  return NextResponse.json({ block: insert.data }, { status: 201 });
}

export async function DELETE(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  let supabase: ReturnType<typeof supabaseAdmin> | null = null;
  try {
    supabase = supabaseAdmin();
  } catch (error) {
    console.error("Supabase unavailable", error);
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  }

  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to delete block", error);
    return NextResponse.json({ error: "Failed to delete block" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

