'use client'

import { useScanMetrics } from '@/hooks/useScanMetrics'

export function LiveExecutionStrip() {
  const m = useScanMetrics()

  if (!m) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/60">
        Checking system status...
      </div>
    )
  }

  return (
    <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/40 px-6 py-4 text-sm text-white">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            m.scanningLive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
          }`}
        />
        <span className="font-medium">
          {m.scanningLive ? 'Scanning live' : 'Next scan window scheduled'}
        </span>
      </div>

      {typeof m.scansThisWindow === 'number' && (
        <div className="text-white/70">
          Scans executed this window:{' '}
          <span className="text-white font-semibold">
            {m.scansThisWindow}
          </span>
        </div>
      )}

      {m.nextEtaMinutes !== null && (
        <div className="text-white/70">
          Next scan ETA:{' '}
          <span className="text-white font-semibold">
            ~{m.nextEtaMinutes} min
          </span>
        </div>
      )}

      {m.executionConfidence && (
        <div className="text-white/70">
          Execution confidence:{' '}
          <span
            className={`font-semibold ${
              m.executionConfidence === 'high'
                ? 'text-emerald-400'
                : m.executionConfidence === 'normal'
                ? 'text-cyan-400'
                : 'text-amber-400'
            }`}
          >
            {m.executionConfidence.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  )
}
