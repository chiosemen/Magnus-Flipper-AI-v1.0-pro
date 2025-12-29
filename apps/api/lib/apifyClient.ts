import { ApifyClient } from 'apify-client';

export type ErrorClass =
  | 'AUTH'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'ACTOR_ERROR'
  | 'NETWORK'
  | 'UNKNOWN';

export type RunActorError = {
  message: string;
  classified: ErrorClass;
  code?: string;
  statusCode?: number;
};

export type RunActorMeta = {
  attempts: number;
  durationMs: number;
  error?: RunActorError;
};

export type RunActorResult = {
  runId: string | null;
  status: string;
  items: any[];
  meta: RunActorMeta;
};

export type RunActorOptions = {
  client?: ApifyClient;
  timeoutMs?: number;
  maxRetries?: number;
  itemsLimit?: number;
  retryDelayBaseMs?: number;
  adjustOnRetry?: (context: {
    attempt: number;
    error: RunActorError;
    input: Record<string, any>;
    itemsLimit: number;
  }) => { input?: Record<string, any>; itemsLimit?: number };
};

const DEFAULT_TIMEOUT_MS = 120000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_ITEMS_LIMIT = 20;
const DEFAULT_RETRY_BASE_MS = 500;

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function classifyError(error: any): RunActorError {
  const message = error?.message ? String(error.message) : 'Unknown error';
  const code = error?.code ? String(error.code) : undefined;
  const statusCode = typeof error?.status === 'number' ? error.status : undefined;
  const status =
    typeof error?.statusCode === 'number'
      ? error.statusCode
      : typeof error?.response?.status === 'number'
      ? error.response.status
      : statusCode;
  const combined = `${message} ${code ?? ''}`.toLowerCase();

  if (status === 401 || status === 403 || combined.includes('unauthorized')) {
    return { message, classified: 'AUTH', code, statusCode: status };
  }
  if (status === 429 || combined.includes('rate limit') || combined.includes('too many')) {
    return { message, classified: 'RATE_LIMIT', code, statusCode: status };
  }
  if (
    combined.includes('timeout') ||
    combined.includes('timed out') ||
    code === 'ETIMEDOUT' ||
    code === 'TIMEOUT'
  ) {
    return { message, classified: 'TIMEOUT', code, statusCode: status };
  }
  if (combined.includes('actor') || combined.includes('dataset') || combined.includes('apify')) {
    return { message, classified: 'ACTOR_ERROR', code, statusCode: status };
  }
  if (
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN'
  ) {
    return { message, classified: 'NETWORK', code, statusCode: status };
  }

  return { message, classified: 'UNKNOWN', code, statusCode: status };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const error: NodeJS.ErrnoException = new Error('Timeout exceeded');
      error.code = 'TIMEOUT';
      reject(error);
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function jitterDelay(baseMs: number, attempt: number): number {
  const exponential = baseMs * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(8000, exponential + jitter);
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runActor(
  actorId: string,
  input: Record<string, any>,
  opts: RunActorOptions = {},
): Promise<RunActorResult> {
  const token = process.env.APIFY_TOKEN;
  const client = opts.client ?? new ApifyClient({ token });
  const timeoutMs =
    opts.timeoutMs ?? parseNumber(process.env.APIFY_RUN_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  const maxRetries =
    opts.maxRetries ?? parseNumber(process.env.APIFY_MAX_RETRIES, DEFAULT_MAX_RETRIES);
  const retryDelayBaseMs = opts.retryDelayBaseMs ?? DEFAULT_RETRY_BASE_MS;

  let currentInput = { ...input };
  let itemsLimit = opts.itemsLimit ?? DEFAULT_ITEMS_LIMIT;
  const startedAt = Date.now();
  let lastError: RunActorError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const run = await withTimeout(client.actor(actorId).call(currentInput), timeoutMs);
      const datasetId = run.defaultDatasetId;
      const { items } = await withTimeout(
        client.dataset(datasetId).listItems({ limit: itemsLimit }),
        timeoutMs,
      );
      return {
        runId: run.id,
        status: run.status ?? 'SUCCEEDED',
        items,
        meta: {
          attempts: attempt + 1,
          durationMs: Date.now() - startedAt,
        },
      };
    } catch (error: any) {
      lastError = classifyError(error);

      if (attempt >= maxRetries) {
        return {
          runId: null,
          status: 'ERROR',
          items: [],
          meta: {
            attempts: attempt + 1,
            durationMs: Date.now() - startedAt,
            error: lastError,
          },
        };
      }

      if (opts.adjustOnRetry) {
        const adjusted = opts.adjustOnRetry({
          attempt: attempt + 1,
          error: lastError,
          input: currentInput,
          itemsLimit,
        });
        if (adjusted.input) {
          currentInput = adjusted.input;
        }
        if (typeof adjusted.itemsLimit === 'number') {
          itemsLimit = adjusted.itemsLimit;
        }
      }

      const delay = jitterDelay(retryDelayBaseMs, attempt);
      await wait(delay);
    }
  }

  return {
    runId: null,
    status: 'ERROR',
    items: [],
    meta: {
      attempts: maxRetries + 1,
      durationMs: Date.now() - startedAt,
      error: lastError ?? { message: 'Unknown error', classified: 'UNKNOWN' },
    },
  };
}
