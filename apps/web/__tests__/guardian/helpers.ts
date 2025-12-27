import { describe } from 'vitest';
import { GUARDIAN_BASE_URL } from '@/lib/guardian';

const baseUrl = GUARDIAN_BASE_URL;
const apiKey = process.env.GUARDIAN_API_KEY;

if (!baseUrl) {
  console.warn(
    "[guardian-tests] GUARDIAN_BASE_URL is missing. Skipping Guardian tests."
  );
}

export const guardianEnabled = Boolean(baseUrl && apiKey);

export const guardianDescribe = guardianEnabled ? describe : describe.skip;

function ensureGuardianEnv() {
  if (!guardianEnabled) {
    throw new Error(
      'Guardian tests require GUARDIAN_API_KEY and a Guardian base URL.'
    );
  }
}

export function guardianHeaders() {
  ensureGuardianEnv();
  return {
    'X-Guardian-Key': apiKey as string,
  };
}

export async function guardianFetch(
  path: string,
  init: RequestInit = {}
) {
  ensureGuardianEnv();
  const url = new URL(path, baseUrl);
  const headers = new Headers(init.headers);
  headers.set('X-Guardian-Key', apiKey as string);

  const body = init.body;
  if (
    body &&
    Object.prototype.toString.call(body) === '[object Object]' &&
    !headers.has('content-type')
  ) {
    headers.set('content-type', 'application/json');
  }

  const finalBody =
    body &&
    Object.prototype.toString.call(body) === '[object Object]'
      ? JSON.stringify(body)
      : body;

  return fetch(url, {
    ...init,
    headers,
    body: finalBody,
  });
}
