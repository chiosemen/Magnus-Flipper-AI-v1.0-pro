/**
 * Thin API client wrapper with auth support
 * Used by hooks for consistent API communication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface ApiClientOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options

  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText)
  }

  return response.json()
}
