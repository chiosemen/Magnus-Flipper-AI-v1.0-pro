'use client'

import useSWR from 'swr'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface FetchOptions {
  fallbackData?: any
  refreshInterval?: number
}

async function fetcher(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      throw new Error('API request failed')
    }

    return await res.json()
  } catch (error) {
    // Return null to trigger fallback
    return null
  }
}

export function useAPI<T = any>(
  endpoint: string,
  options: FetchOptions = {}
) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    `${API_BASE_URL}${endpoint}`,
    fetcher,
    {
      fallbackData: options.fallbackData,
      refreshInterval: options.refreshInterval,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  )

  // If API fails, use fallback data
  const finalData = data || options.fallbackData

  return {
    data: finalData,
    isLoading,
    error,
    mutate,
    isUsingFallback: !data && !!options.fallbackData,
  }
}
