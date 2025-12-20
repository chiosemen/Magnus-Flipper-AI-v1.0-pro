export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { redis } from "@magnus-flipper-ai/queue";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "anonymous";

    const raw = await redis.lrange(`notif:unread:${userId}`, 0, 19);
    const notifications = raw.map((s) => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId = "anonymous", notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: "Missing notificationId" },
        { status: 400 }
      );
    }

    // Remove notification from unread list
    const raw = await redis.lrange(`notif:unread:${userId}`, 0, -1);
    const filtered = raw.filter((s) => {
      try {
        const notif = JSON.parse(s);
        return notif.id !== notificationId;
      } catch {
        return true;
      }
    });

    // Replace list with filtered items
    await redis.del(`notif:unread:${userId}`);
    if (filtered.length > 0) {
      await redis.rpush(`notif:unread:${userId}`, ...filtered);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
