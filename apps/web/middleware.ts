import { NextRequest, NextResponse } from "next/server";

// Routes that should be gated for the Tech Trade canary
const protectedPaths = [
  "/tech-trade",
  "/api/tech-trade",
  "/admin/tech-trade",
];

function isProtectedPath(pathname: string) {
  return protectedPaths.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

function buildAllowlist() {
  const raw = process.env.TECH_TRADE_ALLOWLIST || "";
  return raw
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowlisted(req: NextRequest, allowlist: string[]) {
  if (allowlist.length === 0) return false;

  const headerValue = req.headers.get("x-internal-user")?.toLowerCase().trim();
  const cookieValue = req.cookies.get("internal_user")?.value?.toLowerCase().trim();

  return (
    (headerValue && allowlist.includes(headerValue)) ||
    (cookieValue && allowlist.includes(cookieValue))
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const allowlist = buildAllowlist();

  if (isAllowlisted(req, allowlist)) {
    return NextResponse.next();
  }

  // Block by path type
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // For pages, fail closed with 404 to avoid leaking presence
  return NextResponse.rewrite(new URL("/404", req.url), { status: 404 });
}

// Apply only to the relevant paths
export const config = {
  matcher: ["/tech-trade", "/tech-trade/:path*", "/api/tech-trade/:path*", "/admin/tech-trade/:path*"],
};
