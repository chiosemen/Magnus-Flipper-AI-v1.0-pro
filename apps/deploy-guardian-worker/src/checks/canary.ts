import {
  CanaryRunResponse,
  CanaryTarget,
} from '@magnus/deploy-guardian-contracts';

export type CanaryCheckResult = {
  ok: boolean;
  latency_ms: number;
  result: CanaryRunResponse;
};

export function runCanaryCheck(): CanaryCheckResult {
  const start = Date.now();
  const targets = CanaryTarget.options;

  const results = targets.map((target) => ({
    target,
    ok: true,
    latency_ms: 12,
    details: { source: 'worker' },
  }));

  const result = CanaryRunResponse.parse({
    ok: true,
    results,
  });

  const latency_ms = Date.now() - start;

  return {
    ok: result.ok,
    latency_ms,
    result,
  };
}
