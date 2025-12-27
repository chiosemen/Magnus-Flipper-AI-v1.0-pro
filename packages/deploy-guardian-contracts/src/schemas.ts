import { z } from 'zod';

export const Marketplace = z.enum([
  'facebook',
  'vinted',
  'gumtree',
  'cex',
  'ebay',
  'craigslist',
  'other',
]);

export const Severity = z.enum(['info', 'warn', 'critical']);

export const InvariantScope = z.enum(['global', 'marketplace']);

export const CanaryTarget = z.enum(['auth', 'scrape', 'db', 'api']);
export const CanaryMode = z.enum(['read-only', 'synthetic']);

export const AlertCategory = z.enum([
  'ingestion',
  'invariant',
  'canary',
  'auth',
  'billing',
  'system',
]);

export const JsonLike = z.union([
  z.record(z.any()),
  z.array(z.any()),
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const ErrorResponse = z.object({
  error: z.string(),
  message: z.string(),
  details: z.union([z.record(z.any()), z.array(z.any()), z.string(), z.null()]).optional(),
});

export const HealthCheck = z.object({
  ok: z.boolean(),
  latency_ms: z.number().optional(),
  message: z.string().optional(),
});

export const HealthResponse = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  version: z.string(),
  uptime_seconds: z.number(),
  checks: z.record(HealthCheck),
});

export const LatestError = z.object({
  code: z.string(),
  message: z.string(),
  at: z.string().datetime(),
});

export const LatestResponse = z.object({
  marketplace: Marketplace,
  last_run_at: z.string().datetime(),
  last_ok_at: z.union([z.string().datetime(), z.null()]),
  last_error: z.union([LatestError, z.null()]).optional(),
  lag_seconds: z.number(),
});

export const IngestionRun = z.object({
  id: z.string(),
  marketplace: Marketplace,
  started_at: z.string().datetime(),
  ended_at: z.union([z.string().datetime(), z.null()]).optional(),
  status: z.enum(['ok', 'error', 'running', 'skipped', 'disabled']),
  items: z.number(),
  errors_count: z.number(),
  meta: z.union([z.record(z.any()), z.null()]).optional(),
});

export const IngestionRunsResponse = z.object({
  runs: z.array(IngestionRun),
});

export const InvariantViolation = z.object({
  code: z.string(),
  severity: Severity,
  message: z.string(),
  observed: JsonLike,
  expected: JsonLike,
});

export const InvariantsEvaluateRequest = z.object({
  scope: InvariantScope,
  marketplace: Marketplace.optional(),
  window_minutes: z.number().min(1).default(60).optional(),
});

export const InvariantsEvaluateResponse = z.object({
  ok: z.boolean(),
  violations: z.array(InvariantViolation),
});

export const CanaryRunRequest = z.object({
  targets: z.array(CanaryTarget).min(1),
  mode: CanaryMode,
});

export const CanaryResult = z.object({
  target: CanaryTarget,
  ok: z.boolean(),
  latency_ms: z.number(),
  details: z.union([z.record(z.any()), z.null()]).optional(),
});

export const CanaryRunResponse = z.object({
  ok: z.boolean(),
  results: z.array(CanaryResult),
});

export const Alert = z.object({
  id: z.string(),
  severity: Severity,
  category: AlertCategory,
  message: z.string(),
  created_at: z.string().datetime(),
  context: z.union([z.record(z.any()), z.null()]).optional(),
});

export const AlertsResponse = z.object({
  alerts: z.array(Alert),
});

export type Marketplace = z.infer<typeof Marketplace>;
export type Severity = z.infer<typeof Severity>;
export type HealthResponse = z.infer<typeof HealthResponse>;
export type LatestResponse = z.infer<typeof LatestResponse>;
export type IngestionRun = z.infer<typeof IngestionRun>;
export type IngestionRunsResponse = z.infer<typeof IngestionRunsResponse>;
export type InvariantsEvaluateRequest = z.infer<typeof InvariantsEvaluateRequest>;
export type InvariantsEvaluateResponse = z.infer<typeof InvariantsEvaluateResponse>;
export type CanaryRunRequest = z.infer<typeof CanaryRunRequest>;
export type CanaryRunResponse = z.infer<typeof CanaryRunResponse>;
export type AlertsResponse = z.infer<typeof AlertsResponse>;
