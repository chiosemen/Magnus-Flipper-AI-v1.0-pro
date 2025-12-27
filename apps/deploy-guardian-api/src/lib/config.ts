export type GuardianConfig = {
  port: number;
  apiKey: string;
  version: string;
  guardianEnabled: boolean;
  invariantsEnabled: boolean;
  canaryEnabled: boolean;
  persistenceEnabled: boolean;
  persistenceMode: 'db' | 'memory';
};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
}

export function getConfig(): GuardianConfig {
  const port = Number(process.env.GUARDIAN_PORT ?? 4010);
  const apiKey = process.env.GUARDIAN_API_KEY ?? '';
  const version = process.env.GUARDIAN_VERSION ?? '0.1.0';
  const guardianEnabled = parseBoolean(process.env.GUARDIAN_ENABLED, true);
  const invariantsEnabled = parseBoolean(process.env.INVARIANTS_ENABLED, true);
  const canaryEnabled = parseBoolean(process.env.CANARY_ENABLED, true);
  const persistenceEnabled = parseBoolean(process.env.GUARDIAN_PERSISTENCE_ENABLED, true);
  const persistenceMode =
    persistenceEnabled && Boolean(process.env.DATABASE_URL) ? 'db' : 'memory';

  if (!apiKey) {
    throw new Error('GUARDIAN_API_KEY is required');
  }

  return {
    port,
    apiKey,
    version,
    guardianEnabled,
    invariantsEnabled,
    canaryEnabled,
    persistenceEnabled,
    persistenceMode,
  };
}
