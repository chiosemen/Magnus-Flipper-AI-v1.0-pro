import { NextRequest } from "next/server";

function timingSafeEqual(a: string, b: string): boolean {
  // Minimal timing-safe compare
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * For POST ingestion from CI (recommended).
 * Header: x-deploy-guardian-token: <secret>
 */
export function requireIngestAuth(req: NextRequest): boolean {
  const expected = process.env.DEPLOY_GUARDIAN_INGEST_TOKEN;
  if (!expected) {
    throw new Error("DEPLOY_GUARDIAN_INGEST_TOKEN is not set");
  }
  const token = req.headers.get("x-deploy-guardian-token") ?? "";
  if (!token || !timingSafeEqual(token, expected)) {
    return false;
  }
  return true;
}

/**
 * For read-only dashboard GETs.
 * Simplest safe default: require a separate read token header.
 * Header: x-deploy-guardian-read-token: <secret>
 *
 * (You can later replace this with Supabase user auth / RBAC.)
 */
export function requireReadAuth(req: NextRequest): boolean {
  const expected = process.env.DEPLOY_GUARDIAN_READ_TOKEN;
  if (!expected) {
    // Fail closed by default for security
    return false;
  }
  const token = req.headers.get("x-deploy-guardian-read-token") ?? "";
  if (!token || !timingSafeEqual(token, expected)) {
    return false;
  }
  return true;
}
