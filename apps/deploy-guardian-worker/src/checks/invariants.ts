import {
  InvariantsEvaluateResponse,
  InvariantViolation,
} from '@magnus/deploy-guardian-contracts';

export type InvariantsCheckResult = {
  ok: boolean;
  latency_ms: number;
  result: InvariantsEvaluateResponse;
};

export function runInvariantsCheck(): InvariantsCheckResult {
  const start = Date.now();

  const violations: InvariantViolation[] = [];

  const result = InvariantsEvaluateResponse.parse({
    ok: true,
    violations,
  });

  const latency_ms = Date.now() - start;

  return {
    ok: result.ok,
    latency_ms,
    result,
  };
}
