'use client'

import { SWRConfig } from 'swr'
import type { ReactNode } from 'react'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    // Attach extra info to the error object
    throw error
  }
  return res.json()
}

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: true,
        errorRetryCount: 3,
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  )
}
