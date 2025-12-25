'use client'

import { useEffect, useState } from 'react'

type UserScanStatus =
  | { state: 'loading' }
  | { state: 'anonymous' }
  | { state: 'ready'; scansRemaining: number }
  | { state: 'none' }

export function useUserScanStatus() {
  const [status, setStatus] = useState<UserScanStatus>({ state: 'loading' })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/entitlements/check')

        if (res.status === 401) {
          setStatus({ state: 'anonymous' })
          return
        }

        if (!res.ok) throw new Error()

        const json = await res.json()

        if (json.scansRemaining > 0) {
          setStatus({
            state: 'ready',
            scansRemaining: json.scansRemaining,
          })
        } else {
          setStatus({ state: 'none' })
        }
      } catch {
        setStatus({ state: 'anonymous' })
      }
    }

    load()
  }, [])

  return status
}
