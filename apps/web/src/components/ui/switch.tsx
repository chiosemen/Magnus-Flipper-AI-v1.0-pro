import * as React from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="inline-flex cursor-pointer items-center gap-3">
        <div className="relative">
          <input
            type="checkbox"
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              'h-6 w-10 rounded-full bg-muted transition peer-checked:bg-gradient-to-r peer-checked:from-indigo-blue peer-checked:to-cyan-mint'
            )}
          />
          <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-background shadow transition peer-checked:translate-x-4" />
        </div>
        {label && <span className={cn('text-sm text-muted-foreground', className)}>{label}</span>}
      </label>
    )
  }
)
Switch.displayName = 'Switch'

