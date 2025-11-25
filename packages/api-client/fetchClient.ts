const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const DEFAULT_BASE_URL = resolveDefaultBaseUrl();
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 300;
const DEFAULT_TIMEOUT_MS = 10000;

export interface FetchClientConfig {
  baseUrl?: string;
  getToken?: () => string | null | Promise<string | null>;
  defaultHeaders?: HeadersInit;
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  retryOn?: (response: Response | undefined, error: unknown, attempt: number) => boolean | Promise<boolean>;
}

export interface FetchRequestInit extends RequestInit {
  skipAuth?: boolean;
}

export type FetchClient = <T = unknown>(path: string, init?: FetchRequestInit) => Promise<T>;

export class ApiError extends Error {
  readonly status?: number;
  readonly body?: unknown;

  constructor(message: string, status?: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function createFetchClient(config: FetchClientConfig = {}): FetchClient {
  const {
    baseUrl = DEFAULT_BASE_URL,
    getToken,
    defaultHeaders,
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retryOn,
  } = config;

  const shouldRetry = async (response: Response | undefined, error: unknown, attempt: number) => {
    const decision =
      typeof retryOn === "function" ? await retryOn(response, error, attempt) : defaultShouldRetry(response, error);
    return decision && attempt < retries;
  };

  return async function fetchWithRetry<T>(path: string, init: FetchRequestInit = {}): Promise<T> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= retries) {
      const url = buildUrl(baseUrl, path);
      const headers = mergeHeaders(defaultHeaders, init.headers);
      const token = init.skipAuth ? null : await resolveToken(getToken);
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const body = normalizeBody(init.body);
      if (body != null && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const { signal, cleanup } = combineSignals(init.signal, timeoutMs);

      try {
        const response = await fetch(url, { ...init, body, headers, signal });
        if (response.ok) {
          cleanup();
          return (await parseResponse(response)) as T;
        }

        if (await shouldRetry(response, undefined, attempt)) {
          cleanup();
          await backoff(retryDelayMs, attempt);
          attempt += 1;
          continue;
        }

        cleanup();
        throw await buildApiError(response);
      } catch (error) {
        cleanup();

        if (isAbortError(error) && init.signal?.aborted) {
          throw error;
        }

        if (await shouldRetry(undefined, error, attempt)) {
          await backoff(retryDelayMs, attempt);
          attempt += 1;
          lastError = error;
          continue;
        }

        throw toError(error);
      }
    }

    throw toError(lastError ?? "Request failed after retries");
  };
}

function resolveDefaultBaseUrl() {
  if (typeof process !== "undefined" && process?.env) {
    return (
      process.env.MAGNUS_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "https://api.magnus-flipper.ai"
    );
  }
  return "https://api.magnus-flipper.ai";
}

function buildUrl(baseUrl: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function mergeHeaders(...headersList: Array<HeadersInit | undefined>) {
  const merged = new Headers();
  headersList.forEach((entry) => {
    if (!entry) return;
    new Headers(entry).forEach((value, key) => merged.set(key, value));
  });
  return merged;
}

function normalizeBody(body: BodyInit | Record<string, unknown> | null | undefined): BodyInit | null | undefined {
  if (body == null) return body ?? undefined;
  if (
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    (typeof ReadableStream !== "undefined" && body instanceof ReadableStream)
  ) {
    return body;
  }
  return JSON.stringify(body);
}

function combineSignals(signal: AbortSignal | null | undefined, timeoutMs: number) {
  if (!timeoutMs && !signal) {
    return { signal: undefined, cleanup: () => {} };
  }

  const controller = new AbortController();
  const signals: AbortSignal[] = [];
  if (signal) signals.push(signal);

  const timeout = timeoutMs ? setTimeout(() => controller.abort(makeAbortError("Request timed out")), timeoutMs) : undefined;

  const onAbort = () => controller.abort(makeAbortError("Aborted"));
  signals.forEach((s) => {
    if (s.aborted) {
      controller.abort(makeAbortError("Aborted"));
    } else {
      s.addEventListener("abort", onAbort);
    }
  });

  return {
    signal: signals.length ? controller.signal : signal ?? controller.signal,
    cleanup: () => {
      if (timeout) clearTimeout(timeout);
      signals.forEach((s) => s.removeEventListener("abort", onAbort));
    },
  };
}

async function parseResponse(response: Response) {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (!text) return undefined;
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError("Failed to parse JSON response", response.status, text);
    }
  }
  return text;
}

async function buildApiError(response: Response) {
  let parsedBody: unknown;
  const contentType = response.headers.get("content-type") || "";
  try {
    parsedBody = contentType.includes("application/json") ? await response.json() : await response.text();
  } catch {
    parsedBody = undefined;
  }
  return new ApiError(
    `Request failed with status ${response.status}${response.statusText ? ` (${response.statusText})` : ""}`,
    response.status,
    parsedBody
  );
}

function defaultShouldRetry(response: Response | undefined, error: unknown) {
  if (response) return RETRYABLE_STATUS.has(response.status);
  if (!error) return false;
  if (error instanceof ApiError) return false;
  if (error instanceof Error) return error.name === "TypeError" || error.name === "FetchError" || error.name === "AbortError";
  return false;
}

async function backoff(baseDelayMs: number, attempt: number) {
  const delayMs = Math.min(baseDelayMs * 2 ** attempt, 5000);
  const jitter = Math.random() * 100;
  return new Promise((resolve) => setTimeout(resolve, delayMs + jitter));
}

async function resolveToken(getToken?: () => string | null | Promise<string | null>) {
  if (!getToken) return null;
  return getToken();
}

function isAbortError(error: unknown) {
  if (!error) return false;
  return error instanceof DOMException ? error.name === "AbortError" : error instanceof Error && error.name === "AbortError";
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  return new Error(typeof value === "string" ? value : "Unknown error");
}

function makeAbortError(message: string) {
  if (typeof DOMException !== "undefined") {
    return new DOMException(message, "AbortError");
  }
  const err = new Error(message);
  err.name = "AbortError";
  return err;
}
