'use client'

import { useUserScanStatus } from '@/hooks/useUserScanStatus'

export function UserScanPromise() {
  const s = useUserScanStatus()

  if (s.state !== 'ready') return null

  return (
    <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-300">
      <strong>Your scans will execute next.</strong>{' '}
      {s.scansRemaining} scan{s.scansRemaining > 1 ? 's' : ''} queued for the
      upcoming window.
    </div>
  )
}
