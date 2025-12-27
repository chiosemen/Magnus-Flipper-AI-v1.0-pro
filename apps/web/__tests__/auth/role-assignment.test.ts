import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { ensureUserProfile } from '@/lib/auth/profile';

const ORIGINAL_ENV = { ...process.env };

function buildSupabaseAdminMock(existingProfile: any = null) {
  const state = {
    upsertPayload: null as any,
    metadataPayload: null as any,
  };

  const queryBuilder = {
    select: () => queryBuilder,
    eq: () => queryBuilder,
    maybeSingle: async () => ({ data: existingProfile }),
    upsert: async (payload: any) => {
      state.upsertPayload = payload;
      return { error: null };
    },
  };

  return {
    state,
    client: {
      from: () => queryBuilder,
      auth: {
        admin: {
          updateUserById: async (_id: string, payload: any) => {
            state.metadataPayload = payload;
            return { error: null };
          },
        },
      },
    },
  };
}

const baseUser = {
  id: 'user-123',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'user@example.com',
  email_confirmed_at: null,
  phone: null,
  last_sign_in_at: null,
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} as User;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('ensureUserProfile', () => {
  it('assigns trial plan and trial dates for non-admin users', async () => {
    process.env.ADMIN_EMAIL_ALLOWLIST = '';
    const { client, state } = buildSupabaseAdminMock();

    await ensureUserProfile(
      { ...baseUser, email: 'trial@example.com' },
      { supabaseAdmin: client as any, now: new Date('2026-01-01T00:00:00Z') }
    );

    expect(state.upsertPayload.plan).toBe('trial');
    expect(state.upsertPayload.role).toBe('user');
    expect(state.upsertPayload.trial_started_at).toBe('2026-01-01T00:00:00.000Z');
    expect(state.upsertPayload.trial_expires_at).toBe('2026-01-08T00:00:00.000Z');
  });

  it('assigns admin role/plan for allowlisted emails', async () => {
    process.env.ADMIN_EMAIL_ALLOWLIST = 'admin@example.com';
    const { client, state } = buildSupabaseAdminMock();

    await ensureUserProfile(
      { ...baseUser, email: 'admin@example.com' },
      { supabaseAdmin: client as any, now: new Date('2026-01-01T00:00:00Z') }
    );

    expect(state.upsertPayload.role).toBe('admin');
    expect(state.upsertPayload.plan).toBe('admin');
  });
});
