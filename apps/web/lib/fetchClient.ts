import { getAuthToken } from './auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export async function fetchClient<T>(
  path: string,
  init?: RequestInit & { signal?: AbortSignal }
): Promise<T> {
  const token = getAuthToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: init?.signal,
    cache: 'no-store',
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || `Request failed: ${res.status}`)
  }
  return res.json()
}
