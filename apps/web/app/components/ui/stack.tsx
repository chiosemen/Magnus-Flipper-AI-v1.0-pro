import * as React from "react";
import { cn } from "@/lib/utils";

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "column";
  spacing?: number;
  justify?: "start" | "end" | "center" | "between" | "around";
  align?: "start" | "end" | "center" | "stretch";
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ direction = "column", spacing = 2, justify, align, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        spacing === 1 && "gap-1",
        spacing === 2 && "gap-2",
        spacing === 3 && "gap-3",
        spacing === 4 && "gap-4",
        spacing === 6 && "gap-6",
        justify === "start" && "justify-start",
        justify === "end" && "justify-end",
        justify === "center" && "justify-center",
        justify === "between" && "justify-between",
        justify === "around" && "justify-around",
        align === "start" && "items-start",
        align === "end" && "items-end",
        align === "center" && "items-center",
        align === "stretch" && "items-stretch",
        className
      )}
      {...props}
    />
  )
);
Stack.displayName = "Stack";

export { Stack };
