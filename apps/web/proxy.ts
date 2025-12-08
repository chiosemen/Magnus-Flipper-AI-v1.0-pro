import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/admin/:path*"],
};

export default function proxy(req: NextRequest) {
  try {
    const session = req.cookies.get("session");
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  } catch (err) {
    console.error("Proxy middleware error:", err);
    return NextResponse.next();
  }
}

