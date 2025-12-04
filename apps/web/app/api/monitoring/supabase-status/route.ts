/**
 * GET /api/monitoring/supabase-status
 * Returns Supabase connectivity status and latency
 */

import { NextResponse } from "next/server";
import type { SupabaseStatusResponse } from "@magnus-flipper-ai/core";
import { createMockSupabaseStatus } from "@magnus-flipper-ai/core";

// Fallback to mocks if explicitly set
const USE_MOCK_DATA = process.env.USE_MOCK_MONITORING === "true";

export async function GET() {
  try {
    if (USE_MOCK_DATA) {
      const mockData = createMockSupabaseStatus(true);
      return NextResponse.json(mockData);
    }

    // Perform live Supabase health check
    const startTime = Date.now();
    
    try {
      const { createServerClient } = await import("@/lib/supabase/server");
      const supabase = await createServerClient();
      
      // Simple health check query
      const { error } = await supabase
        .from("users")
        .select("id")
        .limit(1);
      
      const latencyMs = Date.now() - startTime;
      
      // PGRST116 = table not found (acceptable for health check)
      const healthy = !error || error.code === "PGRST116";
      
      const response: SupabaseStatusResponse = {
        healthy,
        latencyMs,
        lastChecked: new Date().toISOString(),
        errorMessage: healthy ? undefined : error?.message,
      };
      
      return NextResponse.json(response);
    } catch (error) {
      const response: SupabaseStatusResponse = {
        healthy: false,
        lastChecked: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      };
      
      return NextResponse.json(response, { status: 503 });
    }
  } catch (error) {
    console.error("Error checking Supabase status:", error);
    return NextResponse.json(
      {
        healthy: false,
        lastChecked: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

