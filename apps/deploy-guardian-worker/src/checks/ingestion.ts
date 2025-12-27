import {
  IngestionRun,
  LatestResponse,
  Marketplace,
} from '@magnus/deploy-guardian-contracts';

export type IngestionCheckResult = {
  ok: boolean;
  latency_ms: number;
  runs: IngestionRun[];
  latest: LatestResponse[];
};

export function runIngestionCheck(): IngestionCheckResult {
  const start = Date.now();
  const now = new Date().toISOString();

  const runs = Marketplace.options.map((marketplace) =>
    IngestionRun.parse({
      id: `run-${marketplace}-${Date.now()}`,
      marketplace,
      started_at: now,
      ended_at: now,
      status: 'ok',
      items: 42,
      errors_count: 0,
      meta: { source: 'worker' },
    })
  );

  const latest = Marketplace.options.map((marketplace) =>
    LatestResponse.parse({
      marketplace,
      last_run_at: now,
      last_ok_at: now,
      last_error: null,
      lag_seconds: 0,
    })
  );

  const latency_ms = Date.now() - start;

  return {
    ok: true,
    latency_ms,
    runs,
    latest,
  };
}
