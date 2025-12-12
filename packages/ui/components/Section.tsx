import * as React from "react";
import { cn } from "./cn";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: "section" | "div" | "article" | "aside";
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, as: Component = "section", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn("w-full", className)}
        {...props}
      />
    );
  }
);
Section.displayName = "Section";

export { Section };
