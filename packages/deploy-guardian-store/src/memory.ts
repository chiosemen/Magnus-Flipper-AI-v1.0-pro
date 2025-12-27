import {
  Alert,
  AlertsResponse,
  CanaryRunResponse,
  IngestionRun,
  InvariantsEvaluateResponse,
  LatestResponse,
  Marketplace,
} from '@magnus/deploy-guardian-contracts';
import type { GuardianStoreState } from './types.js';

const marketplaces = Marketplace.options;

const state: GuardianStoreState = {
  latestByMarketplace: marketplaces.reduce((acc, marketplace) => {
    acc[marketplace] = null;
    return acc;
  }, {} as Record<Marketplace, LatestResponse | null>),
  ingestionRuns: [],
  invariants: null,
  canary: null,
  alerts: [],
};

const MAX_RUNS = 200;
const MAX_ALERTS = 500;

export function setLatest(latest: LatestResponse) {
  state.latestByMarketplace[latest.marketplace] = latest;
}

export function addIngestionRun(run: IngestionRun) {
  state.ingestionRuns.unshift(run);
  if (state.ingestionRuns.length > MAX_RUNS) {
    state.ingestionRuns.length = MAX_RUNS;
  }
}

export function setInvariants(result: InvariantsEvaluateResponse) {
  state.invariants = result;
}

export function setCanary(result: CanaryRunResponse) {
  state.canary = result;
}

export function addAlert(alert: Alert) {
  state.alerts.unshift(alert);
  if (state.alerts.length > MAX_ALERTS) {
    state.alerts.length = MAX_ALERTS;
  }
}

export function getLatest(marketplace: Marketplace): LatestResponse | null {
  return state.latestByMarketplace[marketplace];
}

export function getIngestionRuns(): IngestionRun[] {
  return state.ingestionRuns.slice();
}

export function getInvariants(): InvariantsEvaluateResponse | null {
  return state.invariants;
}

export function getCanary(): CanaryRunResponse | null {
  return state.canary;
}

export function getAlerts(): AlertsResponse {
  return AlertsResponse.parse({ alerts: state.alerts });
}

export function getState(): GuardianStoreState {
  return state;
}

export function cacheLatest(latest: LatestResponse) {
  setLatest(latest);
}

export function cacheIngestionRuns(runs: IngestionRun[]) {
  runs.forEach(addIngestionRun);
}

export function cacheInvariants(result: InvariantsEvaluateResponse) {
  setInvariants(result);
}

export function cacheCanary(result: CanaryRunResponse) {
  setCanary(result);
}

export function cacheAlerts(alerts: AlertsResponse) {
  const parsed = AlertsResponse.parse(alerts);
  parsed.alerts.forEach(addAlert);
}

export function getLatestFromMemory(marketplace: Marketplace): LatestResponse | null {
  return getLatest(marketplace);
}

export function getRunsFromMemory(): IngestionRun[] {
  return getIngestionRuns();
}

export function getInvariantsFromMemory(): InvariantsEvaluateResponse | null {
  return getInvariants();
}

export function getCanaryFromMemory(): CanaryRunResponse | null {
  return getCanary();
}

export function getAlertsFromMemory(): AlertsResponse {
  return getAlerts();
}
