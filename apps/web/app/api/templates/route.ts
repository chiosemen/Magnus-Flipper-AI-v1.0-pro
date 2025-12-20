import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "../../../lib/supabase/admin";

const MAX_LIMIT = 50;

const QuerySchema = z.object({
  marketplace: z.string().optional(),
  region: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 20))
    .transform((v) =>
      Number.isFinite(v) ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(v))) : 20
    ),
});

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(req: Request) {
  let supabase: ReturnType<typeof supabaseAdmin> | null = null;
  try {
    supabase = supabaseAdmin();
  } catch (error) {
    console.error("Supabase unavailable", error);
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    marketplace: searchParams.get("marketplace") ?? undefined,
    region: searchParams.get("region") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    tag: searchParams.get("tag") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const marketplace = normalizeText(parsed.data.marketplace)?.toLowerCase() ?? null;
  const region = normalizeText(parsed.data.region) ?? null;
  const category = normalizeText(parsed.data.category) ?? null;
  const tag = normalizeText(parsed.data.tag) ?? null;
  const limit = parsed.data.limit;

  let query = supabase
    .from("search_templates")
    .select("id, category, title, marketplace, params_json, tags, region, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (marketplace) query = query.eq("marketplace", marketplace);
  if (region) query = query.eq("region", region);
  if (category) query = query.eq("category", category);
  if (tag) query = query.contains("tags", [tag]);

  const { data, error } = await query;
  if (error) {
    console.error("Failed to load templates", error);
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }

  return NextResponse.json({ templates: Array.isArray(data) ? data : [] });
}

