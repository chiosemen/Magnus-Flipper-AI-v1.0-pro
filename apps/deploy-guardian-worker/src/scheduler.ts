import { Alert } from '@magnus/deploy-guardian-contracts';
import { runIngestionCheck } from './checks/ingestion.js';
import { runInvariantsCheck } from './checks/invariants.js';
import { runCanaryCheck } from './checks/canary.js';
import { addAlert, addIngestionRun, setCanary, setInvariants, setLatest } from './store/memory.js';
import { persistAlert, persistCanary, persistIngestion, persistInvariants } from './store/persistence.js';
import type { GuardianWorkerConfig } from './config.js';

function recordAlert(alert: Alert) {
  addAlert(alert);
  void persistAlert(alert).catch((error) => {
    console.error('[guardian-worker] persistAlert failed', error);
  });
}

function buildAlert(code: string, message: string): Alert {
  return Alert.parse({
    id: `alert-${code}-${Date.now()}`,
    severity: 'critical',
    category: 'system',
    message,
    created_at: new Date().toISOString(),
    context: null,
  });
}

async function safeRun(label: string, fn: () => void) {
  try {
    fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    recordAlert(buildAlert(label, message));
    console.error(`[guardian-worker] ${label} failed`, error);
  }
}

export function startScheduler(config: GuardianWorkerConfig) {
  if (!config.enabled) {
    console.log('[guardian-worker] GUARDIAN_ENABLED=false, skipping checks');
    return;
  }

  let ingestionRunning = false;
  let invariantsRunning = false;
  let canaryRunning = false;

  const runIngestion = () => safeRun('ingestion', () => {
    if (ingestionRunning) return;
    ingestionRunning = true;

    const result = runIngestionCheck();
    result.runs.forEach(addIngestionRun);
    result.latest.forEach((latest) => setLatest(latest.marketplace, latest));

    if (!result.ok) {
      recordAlert(buildAlert('ingestion', 'Ingestion check failed'));
    }

    void persistIngestion(result.runs, result.latest).catch((error) => {
      console.error('[guardian-worker] persistIngestion failed', error);
    });

    ingestionRunning = false;
  });

  const runInvariants = () => safeRun('invariants', () => {
    if (!config.invariantsEnabled) return;
    if (invariantsRunning) return;
    invariantsRunning = true;

    const result = runInvariantsCheck();
    setInvariants(result.result);

    if (!result.ok || result.result.violations.length > 0) {
      recordAlert(buildAlert('invariants', 'Invariant violations detected'));
    }

    void persistInvariants(result.result).catch((error) => {
      console.error('[guardian-worker] persistInvariants failed', error);
    });

    invariantsRunning = false;
  });

  const runCanary = () => safeRun('canary', () => {
    if (!config.canaryEnabled) return;
    if (canaryRunning) return;
    canaryRunning = true;

    const result = runCanaryCheck();
    setCanary(result.result);

    if (!result.ok) {
      recordAlert(buildAlert('canary', 'Canary checks failed'));
    }

    void persistCanary(result.result).catch((error) => {
      console.error('[guardian-worker] persistCanary failed', error);
    });

    canaryRunning = false;
  });

  runIngestion();
  runInvariants();
  runCanary();

  setInterval(runIngestion, config.guardianIntervalMs);
  setInterval(runInvariants, config.guardianIntervalMs);
  setInterval(runCanary, config.canaryIntervalMs);
}
