import type { User } from '@supabase/supabase-js';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { computeTrialExpiresAt, isTrialExpired } from './trial';

type ProfileRow = {
  id: string;
  email: string | null;
  role: string | null;
  is_admin: boolean | null;
  plan: string | null;
  trial_started_at: string | null;
  trial_expires_at: string | null;
  is_trial_expired: boolean | null;
};

function parseAdminAllowlist(): Set<string> {
  const raw = process.env.ADMIN_EMAIL_ALLOWLIST ?? '';
  const entries = raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return new Set(entries);
}

function normalizeEmail(email?: string | null): string | null {
  return email ? email.trim().toLowerCase() : null;
}

function resolvePrimaryProvider(user: User): string | undefined {
  const providers = user.identities?.map((identity) => identity.provider) ?? [];
  if (providers.includes('google')) return 'google';
  if (providers.includes('email')) return 'email';
  return user.app_metadata?.provider ?? undefined;
}

function resolvePlan(existingPlan?: string | null, isAdmin?: boolean): string {
  if (isAdmin) return 'admin';
  if (!existingPlan || existingPlan === 'free') {
    return 'trial';
  }
  return existingPlan;
}

async function maybeLinkGoogleIdentity(
  supabaseAdmin: ReturnType<typeof createSupabaseAdmin>,
  user: User,
  email: string | null
) {
  if (!email) return;

  const providers = user.identities?.map((identity) => identity.provider) ?? [];
  if (!providers.includes('google') || providers.includes('email')) {
    return;
  }

  const adminApi = supabaseAdmin.auth.admin as {
    getUserByEmail?: (email: string) => Promise<{ data?: { user?: User | null } }>;
    linkIdentity?: (params: { userId: string; provider: string }) => Promise<{ error?: unknown }>;
  };

  if (!adminApi.getUserByEmail) {
    console.warn('[role-assignment] linkIdentity unavailable: missing getUserByEmail');
    return;
  }

  const { data } = await adminApi.getUserByEmail(email);
  const existingUser = data?.user;

  if (!existingUser || existingUser.id === user.id) {
    return;
  }

  if (!adminApi.linkIdentity) {
    console.warn('[role-assignment] linkIdentity unavailable: missing linkIdentity');
    return;
  }

  const { error } = await adminApi.linkIdentity({
    userId: existingUser.id,
    provider: 'google',
  });

  if (error) {
    console.warn('[role-assignment] linkIdentity failed', error);
  }
}

export async function ensureUserProfile(
  user: User,
  options?: {
    supabaseAdmin?: ReturnType<typeof createSupabaseAdmin>;
    now?: Date;
  }
): Promise<{
  profile: ProfileRow | null;
}> {
  const supabaseAdmin = options?.supabaseAdmin ?? createSupabaseAdmin();
  const now = options?.now ?? new Date();
  const normalizedEmail = normalizeEmail(user.email);
  const allowlist = parseAdminAllowlist();
  const allowlistAdmin = normalizedEmail ? allowlist.has(normalizedEmail) : false;

  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select(
      'id, email, role, is_admin, plan, trial_started_at, trial_expires_at, is_trial_expired'
    )
    .eq('id', user.id)
    .maybeSingle();

  const existingIsAdmin =
    existingProfile?.role === 'admin' || existingProfile?.is_admin === true;

  const isAdmin = existingIsAdmin || allowlistAdmin;
  const role = isAdmin ? 'admin' : 'user';
  const plan = resolvePlan(existingProfile?.plan, isAdmin);

  let trialStartedAt = existingProfile?.trial_started_at ?? null;
  let trialExpiresAt = existingProfile?.trial_expires_at ?? null;

  if (!isAdmin && plan === 'trial') {
    if (!trialStartedAt) {
      trialStartedAt = now.toISOString();
    }
    if (!trialExpiresAt) {
      trialExpiresAt = computeTrialExpiresAt(trialStartedAt);
    }
  }

  const trialExpired = isTrialExpired(plan, trialExpiresAt);

  const profilePayload: Partial<ProfileRow> = {
    id: user.id,
    email: normalizedEmail ?? user.email ?? null,
    role,
    is_admin: isAdmin,
    plan,
    trial_started_at: trialStartedAt,
    trial_expires_at: trialExpiresAt,
    is_trial_expired: trialExpired,
  };

  const { error: upsertError } = await supabaseAdmin
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' });

  if (upsertError) {
    console.warn('[role-assignment] profile upsert failed', upsertError);
  }

  const primaryProvider = resolvePrimaryProvider(user);
  const userMetadata = {
    ...user.user_metadata,
    role,
    plan,
    primary_provider: primaryProvider,
  };

  const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { user_metadata: userMetadata }
  );

  if (metadataError) {
    console.warn('[role-assignment] user metadata update failed', metadataError);
  }

  await maybeLinkGoogleIdentity(supabaseAdmin, user, normalizedEmail);

  return { profile: (existingProfile as ProfileRow | null) ?? null };
}
