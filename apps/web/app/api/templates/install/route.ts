import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { createSupabaseServer } from "../../../../lib/supabase/server";
import { inferAppRegionFromRequest } from "../../../../lib/appRegion";
import type { SavedSearchRow } from "../../../../lib/supabase/types";
import { isMarketplaceSupportedInRegion } from "@magnus-flipper-ai/marketplace-config";

const BodySchema = z.object({
  templateId: z.string().uuid(),
});

function isUniqueViolation(error: any): boolean {
  return typeof error?.code === "string" && error.code === "23505";
}

export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabaseAuth = await createSupabaseServer();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  const userId = user?.id ?? null;
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
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
    .select("id, title, marketplace, params_json, region")
    .eq("id", parsed.data.templateId)
    .maybeSingle();

  if (templateError) {
    console.error("Failed to load template", templateError);
    return NextResponse.json({ error: "Failed to load template" }, { status: 500 });
  }

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const requestedRegion = inferAppRegionFromRequest(req, { user });
  const templateRegion =
    typeof (template as any)?.region === "string" && (template as any).region.trim().length > 0
      ? (template as any).region.trim().toUpperCase()
      : null;

  if (templateRegion && templateRegion !== requestedRegion) {
    return NextResponse.json({ error: "TEMPLATE_REGION_MISMATCH" }, { status: 400 });
  }

  const marketplace =
    typeof (template as any).marketplace === "string" && (template as any).marketplace.trim().length > 0
      ? (template as any).marketplace.trim().toLowerCase()
      : "facebook";

  const includeOptional = process.env.ENABLE_SHPOCK === "true" || process.env.NEXT_PUBLIC_ENABLE_SHPOCK === "true";
  if (!isMarketplaceSupportedInRegion(marketplace, requestedRegion, { includeOptional })) {
    return NextResponse.json({ error: "MARKETPLACE_NOT_SUPPORTED_IN_REGION" }, { status: 400 });
  }

  const nowIso = new Date().toISOString();

  let created: SavedSearchRow | null = null;

  const insertAttempt = await supabase
    .from("saved_searches")
    .insert([
      {
        user_id: userId,
        region: requestedRegion,
        marketplace,
        name: (template as any).title ?? "Saved search",
        params: (template as any).params_json ?? {},
        status: "active",
        updated_at: nowIso,
      },
    ])
    .select("id, user_id, region, name, marketplace, params, status, created_at, updated_at")
    .single();

  if (insertAttempt.error) {
    if (isUniqueViolation(insertAttempt.error)) {
      // Template already installed; return the existing saved search deterministically.
      const existing = await supabase
        .from("saved_searches")
        .select("id, user_id, region, name, marketplace, params, status, created_at, updated_at")
        .eq("user_id", userId)
        .eq("region", requestedRegion)
        .eq("marketplace", marketplace)
        .eq("params", (template as any).params_json ?? {})
        .maybeSingle();
      if (existing.error) {
        console.error("Failed to load existing saved search after dedupe hit", existing.error);
        return NextResponse.json({ error: "Failed to install template" }, { status: 500 });
      }
      created = (existing.data as any) as SavedSearchRow | null;
    } else {
      console.error("Failed to install template (save search)", insertAttempt.error);
      return NextResponse.json({ error: "Failed to install template" }, { status: 500 });
    }
  } else {
    created = (insertAttempt.data as any) as SavedSearchRow;
  }

  // Best-effort adoption tracking (do not block UX).
  await supabase.from("template_installs").insert({
    template_id: (template as any).id,
    user_id: userId,
  });

  return NextResponse.json(
    {
      search: created
        ? {
            ...(created as any),
            deal_count: 0,
            preview_image: null,
            preview_images: null,
            last_updated_at: null,
          }
        : null,
    },
    { status: 201 }
  );
}
