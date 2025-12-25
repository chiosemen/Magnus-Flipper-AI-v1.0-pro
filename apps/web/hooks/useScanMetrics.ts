'use client'

import { useEffect, useState } from 'react'

type ScanMetrics = {
  scanningLive: boolean
  scansThisWindow?: number
  nextEtaMinutes?: number | null
  estimatedExecutionMinutes?: number | null
  executionConfidence?: 'high' | 'normal' | 'degraded'
}

export function useScanMetrics() {
  const [data, setData] = useState<ScanMetrics | null>(null)

  async function load() {
    try {
      const [
        windowRes,
        scansRes,
        etaRes,
        confidenceRes,
      ] = await Promise.all([
        fetch('/api/metrics/scan-window'),
        fetch('/api/metrics/scans-this-window'),
        fetch('/api/metrics/next-scan-eta'),
        fetch('/api/metrics/execution-confidence'),
      ])

      const windowJson = await windowRes.json()
      const scansJson = await scansRes.json()
      const etaJson = await etaRes.json()
      const confidenceJson = await confidenceRes.json()

      setData({
        scanningLive: windowJson.active === true,
        scansThisWindow: scansJson.count,
        nextEtaMinutes: etaJson.etaMinutes ?? null,
        estimatedExecutionMinutes: confidenceJson.avgMinutes ?? null,
        executionConfidence: confidenceJson.confidence ?? 'normal',
      })
    } catch {
      setData(null)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  return data
}
