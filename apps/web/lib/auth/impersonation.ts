import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export const IMPERSONATION_COOKIE_NAME = 'impersonation_session';
const SESSION_DURATION_MS = 30 * 60 * 1000;

export type ImpersonationPayload = {
  admin_user_id: string;
  target_user_id: string;
  exp: number;
};

function base64UrlEncode(input: string): string {
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function getImpersonationSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET or SUPABASE_JWT_SECRET is required for impersonation');
  }
  return secret;
}

export function signImpersonationPayload(payload: ImpersonationPayload): string {
  const secret = getImpersonationSecret();
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyImpersonationToken(token: string): ImpersonationPayload | null {
  const secret = getImpersonationSecret();
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(encoded)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as ImpersonationPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildImpersonationPayload(adminUserId: string, targetUserId: string) {
  return {
    admin_user_id: adminUserId,
    target_user_id: targetUserId,
    exp: Date.now() + SESSION_DURATION_MS,
  };
}

export function readImpersonationCookie() {
  const store = cookies();
  const token = store.get(IMPERSONATION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyImpersonationToken(token);
}

export function getImpersonationMaxAgeSeconds(): number {
  return Math.floor(SESSION_DURATION_MS / 1000);
}
