import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

const textVariants = cva("", {
  variants: {
    variant: {
      h1: "text-h1 font-heading font-bold tracking-tight",
      h2: "text-h2 font-heading font-semibold tracking-tight",
      h3: "text-h3 font-heading font-semibold",
      h4: "text-h4 font-heading font-semibold",
      h5: "text-h5 font-heading font-semibold",
      h6: "text-h6 font-heading font-semibold",
      "body-l": "text-body-l font-body",
      "body-m": "text-body-m font-body",
      "body-s": "text-body-s font-body",
      "mono-l": "text-mono-l font-mono",
      "mono-m": "text-mono-m font-mono",
      "mono-s": "text-mono-s font-mono",
    },
    color: {
      primary: "text-text-primary",
      secondary: "text-text-secondary",
      muted: "text-text-muted",
      inverse: "text-text-inverse",
      success: "text-success",
      warning: "text-warning",
      danger: "text-destructive",
      info: "text-info",
    },
  },
  defaultVariants: {
    variant: "body-m",
    color: "primary",
  },
});

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, variant, color, as, ...props }, ref) => {
    const Component = as || (variant?.startsWith("h") ? (variant as "h1" | "h2" | "h3" | "h4" | "h5" | "h6") : "p");
    
    return (
      <Component
        ref={ref as any}
        className={cn(textVariants({ variant, color, className }))}
        {...props}
      />
    );
  }
);
Text.displayName = "Text";

export { Text, textVariants };
