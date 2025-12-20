import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "../../../../lib/supabase/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

const BodySchema = z.object({
  category: z.string().optional().default("search_optimization"),
  subject: z.string().max(140).optional(),
  message: z.string().min(10).max(5000),
  email: z.string().email().optional(),
  metadata: z.record(z.any()).optional(),
});

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

  let userId: string | null = null;
  let userEmail: string | null = null;

  try {
    const supabaseAuth = await createSupabaseServer();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    userId = user?.id ?? null;
    userEmail = typeof user?.email === "string" ? user.email : null;
  } catch {
    userId = null;
    userEmail = null;
  }

  const email = parsed.data.email ?? userEmail ?? null;
  if (!userId && !email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  let supabase: ReturnType<typeof supabaseAdmin> | null = null;
  try {
    supabase = supabaseAdmin();
  } catch (error) {
    console.error("Supabase unavailable", error);
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: userId,
      email,
      category: parsed.data.category,
      subject: parsed.data.subject ?? null,
      message: parsed.data.message,
      metadata: {
        ...(parsed.data.metadata ?? {}),
        user_agent: req.headers.get("user-agent") ?? null,
      },
    })
    .select("id, created_at, status")
    .single();

  if (error || !data) {
    console.error("Failed to create support ticket", error);
    return NextResponse.json({ error: "Failed to submit ticket" }, { status: 500 });
  }

  return NextResponse.json({ ticket: data }, { status: 201 });
}

