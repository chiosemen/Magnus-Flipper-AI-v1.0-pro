const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

export function getApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not set');
  }
  return API_BASE_URL;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));
  return { response, json: json as T };
}
