import React from 'react'

export interface UsageBarProps {
  value: number
  label: string
  className?: string
}

/**
 * UsageBar - Display usage percentage with a gradient progress bar
 * Part of shared UI design system
 */
export function UsageBar({ value, label, className }: UsageBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <span>{clamped}%</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-blue to-cyan-mint transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
