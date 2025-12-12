import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

const inputVariants = cva(
  "flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
  {
    variants: {
      variant: {
        default: "border-input hover:border-input/80",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-success focus-visible:ring-success",
      },
      size: {
        default: "h-10",
        sm: "h-9 text-xs",
        lg: "h-11 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  /**
   * Error state - shows error styling
   */
  error?: boolean;
  /**
   * Success state - shows success styling
   */
  success?: boolean;
  /**
   * Left icon element
   */
  iconLeft?: React.ReactNode;
  /**
   * Right icon element
   */
  iconRight?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    variant,
    size,
    error,
    success,
    iconLeft,
    iconRight,
    ...props 
  }, ref) => {
    const effectiveVariant = error ? "error" : success ? "success" : variant;
    const hasIcons = iconLeft || iconRight;

    if (hasIcons) {
      return (
        <div className="relative flex items-center">
          {iconLeft && (
            <span className="absolute left-3 text-muted-foreground" aria-hidden="true">
              {iconLeft}
            </span>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant: effectiveVariant, size }),
              iconLeft && "pl-9",
              iconRight && "pr-9",
              className
            )}
            ref={ref}
            aria-invalid={error}
            {...props}
          />
          {iconRight && (
            <span className="absolute right-3 text-muted-foreground" aria-hidden="true">
              {iconRight}
            </span>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(inputVariants({ variant: effectiveVariant, size }), className)}
        ref={ref}
        aria-invalid={error}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
