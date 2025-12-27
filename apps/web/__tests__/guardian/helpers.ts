import { describe } from 'vitest';

const baseUrl = process.env.GUARDIAN_BASE_URL;
const apiKey = process.env.GUARDIAN_API_KEY;

export const guardianEnv = {
  baseUrl,
  apiKey,
  hasEnv: Boolean(baseUrl && apiKey),
};

export const guardianDescribe = guardianEnv.hasEnv ? describe : describe.skip;

export function guardianHeaders() {
  return {
    'X-Guardian-Key': apiKey as string,
  };
}
