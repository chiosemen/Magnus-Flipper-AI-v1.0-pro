import { NextResponse } from "next/server";
import { createSupabaseServer, getUser } from "@/lib/supabase/server";

// Force Node.js runtime for server-only API routes (Vercel safety)
export const runtime = "nodejs";

/**
 * Admin Controls API - SAFE MODE kill-switches for marketplace scraping
 *
 * CRITICAL SECURITY:
 * ==================
 * - MUST verify admin role server-side BEFORE any operation
 * - Client-side guards are UX only (not security)
 * - This route writes configuration flags ONLY (no worker manipulation)
 *
 * ARCHITECTURE SAFETY:
 * ====================
 * This API route DOES NOT:
 * - Access Redis or BullMQ queues
 * - Trigger immediate scraping actions
 * - Directly manipulate workers or jobs
 * - Cause race conditions with running workers
 *
 * WHY THIS IS SAFER THAN DIRECT JOB CANCELLATION:
 * ================================================
 * - Workers poll this table on their next cycle (eventual consistency)
 * - No distributed coordination required
 * - Single source of truth (Supabase table)
 * - Audit trail built-in (updated_at, updated_by)
 * - Idempotent operations (setting flag multiple times is safe)
 *
 * WHY THIS PRESERVES POOLED-ONLY DOCTRINE:
 * ========================================
 * - Flags control worker behavior, not data queries
 * - No per-user scraping triggers from this API
 * - Workers self-throttle based on global configuration
 * - Dashboard remains read-only for visualization
 *
 * REQUIRED SUPABASE SETUP:
 * ========================
 * Table: admin_controls (single row with id = 1)
 * Columns:
 *   - id: bigint (primary key)
 *   - disable_all_scraping: boolean (default false)
 *   - disable_marketplace_facebook: boolean (default false)
 *   - disable_marketplace_cars: boolean (default false)
 *   - global_rate_multiplier: real (default 1.0)
 *   - notes: text (nullable)
 *   - updated_at: timestamptz (auto-update trigger)
 *   - updated_by: text (nullable)
 *
 * RLS Policy (required):
 * ```sql
 * -- Allow admins to read and update admin_controls
 * CREATE POLICY "Admin can read admin_controls"
 *   ON admin_controls FOR SELECT
 *   USING (auth.jwt() ->> 'role' = 'admin');
 *
 * CREATE POLICY "Admin can update admin_controls"
 *   ON admin_controls FOR UPDATE
 *   USING (auth.jwt() ->> 'role' = 'admin');
 * ```
 *
 * WORKER INTEGRATION (not implemented in this file):
 * ==================================================
 * Workers should read flags at start of each cycle:
 * ```typescript
 * const { data: controls } = await supabase
 *   .from("admin_controls")
 *   .select("*")
 *   .eq("id", 1)
 *   .single();
 *
 * if (controls.disable_all_scraping) {
 *   console.log("Scraping globally disabled, skipping...");
 *   return;
 * }
 *
 * if (controls[`disable_marketplace_${marketplace}`]) {
 *   console.log(`Marketplace ${marketplace} disabled, skipping...`);
 *   return;
 * }
 *
 * const delay = BASE_DELAY * controls.global_rate_multiplier;
 * ```
 */

interface AdminControls {
  id: number;
  disable_all_scraping: boolean;
  disable_marketplace_facebook: boolean;
  disable_marketplace_cars: boolean;
  global_rate_multiplier: number;
  notes: string;
  updated_at: string;
  updated_by: string | null;
}

/**
 * GET /api/admin/controls
 * Fetch current admin control flags
 */
export async function GET() {
  try {
    // ========================================================================
    // ADMIN GUARD: Server-side authentication enforcement
    // ========================================================================
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = user.app_metadata?.role as string | undefined;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    // ========================================================================
    // Fetch admin controls (single row with id = 1)
    // ========================================================================
    const supabase = await createSupabaseServer();

    const { data: controls, error } = await supabase
      .from("admin_controls")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      // If table doesn't exist or row is missing, return defaults
      console.error("Failed to fetch admin controls:", error);

      // Return default values if table is not set up yet
      const defaults: Partial<AdminControls> = {
        id: 1,
        disable_all_scraping: false,
        disable_marketplace_facebook: false,
        disable_marketplace_cars: false,
        global_rate_multiplier: 1.0,
        notes: "",
        updated_at: new Date().toISOString(),
        updated_by: null,
      };

      return NextResponse.json(defaults);
    }

    return NextResponse.json(controls);
  } catch (error) {
    console.error("Error in GET /api/admin/controls:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/controls
 * Update admin control flags (partial update)
 */
export async function PATCH(request: Request) {
  try {
    // ========================================================================
    // ADMIN GUARD: Server-side authentication enforcement
    // ========================================================================
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = user.app_metadata?.role as string | undefined;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    // ========================================================================
    // Parse and validate request body
    // ========================================================================
    const body = await request.json();

    // Allowed fields for update (whitelist)
    const allowedFields = [
      "disable_all_scraping",
      "disable_marketplace_facebook",
      "disable_marketplace_cars",
      "global_rate_multiplier",
      "notes",
    ];

    // Filter out disallowed fields
    const updates: Partial<AdminControls> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field as keyof AdminControls] = body[field];
      }
    }

    // Validate global_rate_multiplier range
    if ("global_rate_multiplier" in updates) {
      const multiplier = updates.global_rate_multiplier as number;
      if (multiplier < 0.1 || multiplier > 3.0) {
        return NextResponse.json(
          { error: "global_rate_multiplier must be between 0.1 and 3.0" },
          { status: 400 }
        );
      }
    }

    // Add audit fields
    const finalUpdates = {
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: user.email || user.id,
    };

    // ========================================================================
    // Update admin controls in Supabase
    // ========================================================================
    const supabase = await createSupabaseServer();

    const { data: updated, error } = await supabase
      .from("admin_controls")
      .update(finalUpdates)
      .eq("id", 1)
      .select()
      .single();

    if (error) {
      // If row doesn't exist, try to insert it
      if (error.code === "PGRST116") {
        const { data: inserted, error: insertError } = await supabase
          .from("admin_controls")
          .insert({
            id: 1,
            disable_all_scraping: false,
            disable_marketplace_facebook: false,
            disable_marketplace_cars: false,
            global_rate_multiplier: 1.0,
            notes: "",
            ...finalUpdates,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Failed to insert admin controls:", insertError);
          return NextResponse.json(
            { error: "Failed to initialize admin controls" },
            { status: 500 }
          );
        }

        return NextResponse.json(inserted);
      }

      console.error("Failed to update admin controls:", error);
      return NextResponse.json(
        { error: "Failed to update admin controls" },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error in PATCH /api/admin/controls:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
