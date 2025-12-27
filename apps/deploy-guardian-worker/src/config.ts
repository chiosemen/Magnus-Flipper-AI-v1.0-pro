export type GuardianWorkerConfig = {
  enabled: boolean;
  invariantsEnabled: boolean;
  canaryEnabled: boolean;
  persistenceEnabled: boolean;
  guardianIntervalMs: number;
  canaryIntervalMs: number;
};

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

export function getConfig(): GuardianWorkerConfig {
  const enabled = parseBoolean(process.env.GUARDIAN_ENABLED, true);
  const invariantsEnabled = parseBoolean(process.env.INVARIANTS_ENABLED, true);
  const canaryEnabled = parseBoolean(process.env.CANARY_ENABLED, true);
  const persistenceEnabled = parseBoolean(process.env.GUARDIAN_PERSISTENCE_ENABLED, true);

  const guardianIntervalMs = Number(process.env.GUARDIAN_INTERVAL_MS ?? 60_000);
  const canaryIntervalMs = Number(process.env.CANARY_INTERVAL_MS ?? 300_000);

  return {
    enabled,
    invariantsEnabled,
    canaryEnabled,
    persistenceEnabled,
    guardianIntervalMs,
    canaryIntervalMs,
  };
}
