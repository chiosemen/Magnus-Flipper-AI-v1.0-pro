import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import * as React from 'react'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[--accent-blue] text-black',
        secondary: 'border-transparent bg-[--accent-purple] text-white',
        outline: 'border-[--border] text-[--foreground]',
        warning: 'border-transparent bg-yellow-500/20 text-yellow-200',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
