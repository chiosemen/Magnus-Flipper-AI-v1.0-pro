const DEFAULT_TRIAL_DAYS = 7;

export function getTrialDurationDays(): number {
  const raw = process.env.TRIAL_DURATION_DAYS;
  if (!raw) return DEFAULT_TRIAL_DAYS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TRIAL_DAYS;
}

export function computeTrialExpiresAt(startedAtIso: string): string {
  const startedAt = new Date(startedAtIso);
  const expiresAt = new Date(
    startedAt.getTime() + getTrialDurationDays() * 24 * 60 * 60 * 1000
  );
  return expiresAt.toISOString();
}

export function isTrialExpired(plan: string | null | undefined, expiresAtIso: string | null | undefined): boolean {
  if (plan !== 'trial' || !expiresAtIso) return false;
  return new Date(expiresAtIso).getTime() < Date.now();
}
