const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

export function getApiBaseUrl() {
  if (!API_BASE_URL) {
    // Fallback for demo mode
    return 'https://magnus-api.vercel.app';
  }
  return API_BASE_URL;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  demoMode = false,
) {
  const baseUrl = getApiBaseUrl();
  const url = new URL(`${baseUrl}${path}`);
  
  // Add demo=true if in demo mode
  if (demoMode && !url.searchParams.has('demo')) {
    url.searchParams.set('demo', 'true');
  }
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(url.toString(), {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const json = await response.json().catch(() => ({}));
    return { response, json: json as T };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}
