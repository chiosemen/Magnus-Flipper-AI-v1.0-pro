import { NextRequest, NextResponse } from "next/server";

const flag = process.env.NEXT_PUBLIC_APIFY_ONLY_MODE;
const APIFY_ONLY_MODE = flag === undefined ? true : flag !== "false";

const BLOCKED = ["/api/searches", "/api/deals", "/api/health/workers"];

export function middleware(req: NextRequest) {
  if (!APIFY_ONLY_MODE) return NextResponse.next();

  const pathname = req.nextUrl.pathname;
  if (BLOCKED.some((p) => pathname.startsWith(p))) {
    return NextResponse.json(
      { error: "Legacy endpoint disabled in Apify-only mode" },
      { status: 410 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
