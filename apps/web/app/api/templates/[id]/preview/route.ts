import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "../../../../../lib/supabase/admin";
import { dealMatchesSavedSearch, rankDealsForDisplay } from "@magnus-flipper-ai/deal-matching";

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

const QuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 8))
    .transform((v) => (Number.isFinite(v) ? Math.max(1, Math.min(12, Math.floor(v))) : 8)),
});

function isUnknownColumnOrTable(error: any): boolean {
  const code = typeof error?.code === "string" ? error.code : "";
  const message = typeof error?.message === "string" ? error.message : "";
  return (
    code === "42703" ||
    code === "42P01" ||
    message.toLowerCase().includes("does not exist") ||
    message.toLowerCase().includes("column") ||
    message.toLowerCase().includes("relation")
  );
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await ctx.params;
  const parsedParams = ParamsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const parsedQuery = QuerySchema.safeParse({ limit: searchParams.get("limit") ?? undefined });
  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  let supabase: ReturnType<typeof supabaseAdmin> | null = null;
  try {
    supabase = supabaseAdmin();
  } catch (error) {
    console.error("Supabase unavailable", error);
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  }

  const { data: template, error: templateError } = await supabase
    .from("search_templates")
    .select("id, marketplace, params_json, region")
    .eq("id", parsedParams.data.id)
    .maybeSingle();

  if (templateError) {
    console.error("Failed to load template", templateError);
    return NextResponse.json({ error: "Failed to load template" }, { status: 500 });
  }

  if (!template) {
    return NextResponse.json({ deals: [] });
  }

  const marketplace =
    typeof (template as any).marketplace === "string" && (template as any).marketplace.trim().length > 0
      ? (template as any).marketplace.trim().toLowerCase()
      : "facebook";

  const region =
    typeof (template as any)?.region === "string" && (template as any).region.trim().length > 0
      ? (template as any).region.trim().toUpperCase()
      : null;

  const limit = parsedQuery.data.limit;

  const selectWithFetched =
    "id, marketplace, title, price, currency, score, location, url, primary_image, images, thumbnail, attributes, data, created_at, fetched_at, posted_at, search_id";
  const selectLegacy =
    "id, marketplace, title, price, currency, score, location, url, data, created_at, search_id";

  let { data: deals, error: dealsError } = await supabase
    .from("deals")
    .select(selectWithFetched)
    .eq("region", region ?? "US")
    .eq("marketplace", marketplace)
    .is("search_id", null)
    .order("fetched_at", { ascending: false })
    .limit(250);

  if (dealsError && isUnknownColumnOrTable(dealsError)) {
    const fallback = await supabase
      .from("deals")
      .select(selectLegacy)
      .eq("marketplace", marketplace)
      .is("search_id", null)
      .order("created_at", { ascending: false })
      .limit(250);
    deals = fallback.data as any;
    dealsError = fallback.error;
  }

  if (dealsError) {
    console.error("Failed to load deals for template preview", dealsError);
    return NextResponse.json({ deals: [] });
  }

  const candidate = Array.isArray(deals) ? (deals as any[]) : [];
  const matched = candidate.filter((deal) =>
    dealMatchesSavedSearch(deal as any, { marketplace, params: (template as any).params_json ?? {} } as any)
  );
  const ranked = rankDealsForDisplay(matched as any) as any[];

  return NextResponse.json({ deals: ranked.slice(0, limit) });
}
