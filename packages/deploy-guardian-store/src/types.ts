import type {
  Alert,
  CanaryRunResponse,
  IngestionRun,
  InvariantsEvaluateResponse,
  LatestResponse,
  Marketplace,
} from '@magnus/deploy-guardian-contracts';

export type GuardianStoreState = {
  latestByMarketplace: Record<Marketplace, LatestResponse | null>;
  ingestionRuns: IngestionRun[];
  invariants: InvariantsEvaluateResponse | null;
  canary: CanaryRunResponse | null;
  alerts: Alert[];
};
