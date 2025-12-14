import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { markAlertAsRead } from "@magnus-flipper-ai/core/alerts/alert-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * PATCH /api/alerts/:id
 * Mark alert as read
 * Body: { isRead: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isRead } = body;

    if (typeof isRead !== "boolean") {
      return NextResponse.json(
        { error: "isRead must be a boolean" },
        { status: 400 }
      );
    }

    if (isRead) {
      await markAlertAsRead(id, user.id);
    }

    return NextResponse.json({
      success: true,
      message: "Alert updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert", message: error.message },
      { status: 500 }
    );
  }
}
