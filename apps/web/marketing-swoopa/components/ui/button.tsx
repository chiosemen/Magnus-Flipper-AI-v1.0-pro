"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-[#0A0A0A] hover:from-[#00E5FF]/90 hover:to-[#7B2FFF]/90 font-extrabold shadow-[0_0_40px_rgba(0,229,255,0.4)] hover:shadow-[0_0_60px_rgba(123,47,255,0.5)] transition-all",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-white/10 bg-transparent text-white hover:bg-[#121212] hover:border-[#00E5FF]/50",
        secondary: "bg-[#121212] text-white hover:bg-[#121212]/80",
        ghost: "hover:bg-[#121212] hover:text-white",
        link: "text-[#00E5FF] underline-offset-4 hover:underline",
        hero: "bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-[#0A0A0A] font-extrabold shadow-[0_0_40px_rgba(0,229,255,0.4)] hover:shadow-[0_0_60px_rgba(123,47,255,0.5)] hover:scale-105 active:scale-100 transition-all",
        heroOutline: "border-2 border-[#00E5FF]/50 bg-[#00E5FF]/5 text-white hover:bg-[#00E5FF]/10 hover:border-[#00E5FF] backdrop-blur-sm",
        glow: "bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-[#0A0A0A] font-extrabold shadow-[0_0_40px_rgba(0,229,255,0.6)] hover:shadow-[0_0_80px_rgba(123,47,255,0.8)] hover:scale-105 transition-all",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
