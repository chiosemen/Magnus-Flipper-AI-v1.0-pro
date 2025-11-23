import { cn } from '@/lib/utils'
import * as React from 'react'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-[--border] bg-[--surface] text-[--foreground] shadow-card', className)}
      {...props}
    />
  )
}
