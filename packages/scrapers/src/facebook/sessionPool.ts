// Session pool for Facebook scraping
// Redis-backed session management for legitimate session reuse

import { redis } from "@magnus-flipper-ai/queue";

export interface FBSession {
  id: string;
  cookies: string;
  userAgent: string;
  locale: string;
  tz: string;
}

const SESSION_SET_KEY = "fb:sessions";

/**
 * Acquire a random session from the pool
 * Returns session ID or null if pool is empty
 */
export async function acquireSession(): Promise<string | null> {
  const sessionId = await redis.srandmember(SESSION_SET_KEY);
  return sessionId ? String(sessionId) : null;
}

/**
 * Get session data by ID
 */
export async function getSession(sessionId: string): Promise<FBSession | null> {
  const raw = await redis.get(`fb:session:${sessionId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Release session back to pool (or add new session)
 */
export async function releaseSession(session: FBSession): Promise<void> {
  await redis.set(`fb:session:${session.id}`, JSON.stringify(session), "EX", 86400 * 7); // 7 days TTL
  await redis.sadd(SESSION_SET_KEY, session.id);
}

/**
 * Remove session from pool (e.g., if expired or invalid)
 */
export async function removeSession(sessionId: string): Promise<void> {
  await redis.srem(SESSION_SET_KEY, sessionId);
  await redis.del(`fb:session:${sessionId}`);
}
