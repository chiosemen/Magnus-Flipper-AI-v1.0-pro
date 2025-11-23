import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[--accent-blue]',
  {
    variants: {
      variant: {
        default: 'bg-[--accent-blue] text-black hover:bg-[--accent-blue]/90',
        secondary: 'bg-[--accent-purple] text-white hover:bg-[--accent-purple]/90',
        outline:
          'border border-[--border] text-[--foreground] hover:border-[--accent-blue] hover:text-[--accent-blue]',
        ghost: 'text-[--foreground] hover:bg-[--muted]',
        destructive: 'bg-red-500 text-white hover:bg-red-500/90',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        lg: 'h-11 px-5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
)
Button.displayName = 'Button'
